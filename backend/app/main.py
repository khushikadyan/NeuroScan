import os
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from PIL import Image
from sqlmodel import select, Session

from .database import init_db, get_session, Doctor, Patient, Report
from .schemas import DoctorCreate, DoctorLogin, PatientCreate, PatientUpdate
from .auth import hash_password, verify_password, create_token, decode_token
from .model_tf import load_keras_model, predict
from .report_pdf import generate_report
from sqlalchemy import func
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import Header, Query
from sqlalchemy import func, desc
from fastapi import HTTPException, Depends, Response

from app.vision.preprocess import preprocess_for_model, infer_input_size
from app.vision.gradcam import gradcam_heatmap, save_overlay, ensure_built


load_dotenv()  # read .env

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
REPORT_DIR = os.path.join(os.path.dirname(__file__), "reports")
LOGO_PATH  = os.path.join(os.path.dirname(__file__), "static", "logo.png")
MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(os.path.dirname(__file__), "models", "resnet50_brain.h5"))

# Ensure numpy is available for argmax used during inference and provide default class names.
import numpy as np
CLASSES = [s.strip() for s in os.getenv("CLASSES", "no_tumor,tumor").split(",")]

app = FastAPI(title="MedVision API (TF/Keras + Postgres)", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# init DB + load model once
init_db()
model = load_keras_model(MODEL_PATH)

def get_current_doctor(
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session)
) -> Doctor:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    subject = decode_token(authorization)  # token is sent directly (not Bearer ...)
    if not subject:
        raise HTTPException(status_code=401, detail="Invalid token")
    doc = session.exec(select(Doctor).where(Doctor.email == subject)).first()
    if not doc:
        raise HTTPException(status_code=401, detail="Doctor not found")
    return doc

@app.get("/health")
def health():
    return {"ok": True}

# ---------- Auth ----------
@app.post("/auth/register")
def register(doctor: DoctorCreate):
    with get_session() as session:
        if session.exec(select(Doctor).where(Doctor.email == doctor.email)).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        doc = Doctor(email=doctor.email, full_name=doctor.full_name, password_hash=hash_password(doctor.password))
        session.add(doc); session.commit(); session.refresh(doc)
        return {"ok": True, "id": doc.id}

@app.post("/auth/login")
def login(creds: DoctorLogin):
    with get_session() as session:
        doc = session.exec(select(Doctor).where(Doctor.email == creds.email)).first()
        if not doc or not verify_password(creds.password, doc.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = create_token(doc.email)
        return {"token": token, "doctor": {"id": doc.id, "full_name": doc.full_name, "email": doc.email}}

# ---------- Patients ----------
@app.post("/patients")
def create_patient(p: PatientCreate, doctor: Doctor = Depends(get_current_doctor)):
    with get_session() as session:
        if session.exec(select(Patient).where(Patient.mrn == p.mrn)).first():
            raise HTTPException(status_code=400, detail="MRN already exists")
        patient = Patient(**p.model_dump())
        session.add(patient); session.commit(); session.refresh(patient)
        return {"id": patient.id}

@app.get("/patients")
def list_patients(doctor: Doctor = Depends(get_current_doctor)):
    with get_session() as session:
        pts = session.exec(select(Patient)).all()
        return [{"id":x.id,"first_name":x.first_name,"last_name":x.last_name,"dob":x.dob,"mrn":x.mrn,"notes":x.notes} for x in pts]

@app.patch("/patients/{patient_id}")
def update_patient(patient_id: int, p: PatientUpdate, doctor: Doctor = Depends(get_current_doctor)):
    with get_session() as session:
        pat = session.get(Patient, patient_id)
        if not pat: raise HTTPException(status_code=404, detail="Not found")
        for k,v in p.model_dump(exclude_unset=True).items(): setattr(pat, k, v)
        session.add(pat); session.commit()
        return {"ok": True}

@app.delete("/patients/{patient_id}")
def delete_patient(patient_id: int, doctor: Doctor = Depends(get_current_doctor)):
    with get_session() as session:
        pat = session.get(Patient, patient_id)
        if not pat: raise HTTPException(status_code=404, detail="Not found")
        session.delete(pat); session.commit()
        return {"ok": True}

# ---------- Inference + Report ----------
@app.post("/inference")
async def run_inference(
    patient_id: int = Form(...),
    file: UploadFile = File(...),
    doctor: Doctor = Depends(get_current_doctor),
):
    """
    - Saves upload
    - Uses SAME preprocessing as training (crop → resize → preprocess_input)
    - Predicts label & probability
    - Computes Grad-CAM on the SAME tensor `x`
    - Generates professional PDF with logo + heatmap
    - Saves Report row and returns JSON with filenames
    """
    # 0) Save uploaded image
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # 1) Predict with consistent preprocessing
    img_pil = Image.open(file_path).convert("RGB")
    x = preprocess_for_model(img_pil, model)          # (1, H, W, 3) — EXACTLY like training
    preds = model.predict(x, verbose=0)               # (1, C) or (1, 1)

    # Handle binary vs multiclass
    num_outputs = preds.shape[-1]
    if num_outputs == 1:
        # Binary sigmoid → probability of positive class (assumed "tumor")
        score = float(preds[0][0])
        label = "tumor" if score >= 0.5 else "no_tumor"
        prob  = score if label == "tumor" else (1.0 - score)
        class_index_for_cam = 0  # single logit
    else:
        # Multiclass softmax
        idx   = int(np.argmax(preds[0]))
        prob  = float(preds[0][idx])
        # Make sure CLASSES matches your training order
        label = CLASSES[idx] if idx < len(CLASSES) else f"class_{idx}"
        class_index_for_cam = idx

    # 2) Grad-CAM on the SAME tensor `x` (robust even for Sequential models)
    overlay_path = None
    try:
        # ensure model has concrete inputs/outputs (needed if Sequential without explicit Input)
        ensure_built(model, (x.shape[1], x.shape[2]))

        heatmap, last_layer = gradcam_heatmap(model, x, class_index=class_index_for_cam)
        ov_dir = os.path.join(UPLOAD_DIR, "overlays")
        os.makedirs(ov_dir, exist_ok=True)
        stem = os.path.splitext(file.filename)[0]
        overlay_path = os.path.join(ov_dir, f"overlay_{stem}.png")

        # Blend heatmap on the ORIGINAL saved image (keeps original resolution in the PDF)
        save_overlay(file_path, heatmap, overlay_path, alpha=0.35, colormap="jet")
        print(f"[GradCAM] layer={last_layer} overlay={overlay_path}")
    except Exception as e:
        print("[GradCAM] failed:", repr(e))
        overlay_path = None  # PDF will show "Heatmap unavailable" gracefully

    # 3) Persist report + generate PDF
    os.makedirs(REPORT_DIR, exist_ok=True)
    with get_session() as session:
        patient = session.get(Patient, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        report_filename = f"report_patient{patient_id}_{os.path.splitext(file.filename)[0]}.pdf"
        report_path = os.path.join(REPORT_DIR, report_filename)

        generate_report(
            report_path,
            patient_name=f"{patient.first_name} {patient.last_name}",
            doctor_name=doctor.full_name,
            mrn=patient.mrn,
            image_name=file.filename,
            image_path=file_path,        # left panel in PDF
            heatmap_path=overlay_path,   # right panel in PDF (may be None)
            organization="NeuroScan Imaging",
            logo_path=LOGO_PATH,
            result=label,
            prob=float(prob),
        )

        rec = Report(
            patient_id=patient_id,
            doctor_id=doctor.id,
            image_filename=file.filename,
            result_label=label,
            probability=float(prob),
            report_path=report_path,
        )
        session.add(rec)
        session.commit()
        session.refresh(rec)

        return {
            "label": label,
            "probability": float(prob),
            "report_id": rec.id,
            "report_file": report_filename,
            "overlay_file": (os.path.basename(overlay_path) if overlay_path else None),
        }




@app.get("/reports/{report_file}")
def download_report(report_file: str, doctor: Doctor = Depends(get_current_doctor)):
    path = os.path.join(REPORT_DIR, report_file)
    if not os.path.exists(path): raise HTTPException(status_code=404, detail="Report not found")
    return FileResponse(path, media_type="application/pdf", filename=report_file)

@app.delete("/reports/id/{report_id}", status_code=204)
def delete_report(report_id: int, doctor: Doctor = Depends(get_current_doctor)):
    with get_session() as session:
        r = session.get(Report, report_id)
        if not r:
            raise HTTPException(status_code=404, detail="Report not found")

        # Only the doctor who created it can delete (tighten if you want admins)
        if r.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="Not allowed")

        # Try to remove generated files (PDF + overlay). Keep source image (optional).
        try:
            if r.report_path and os.path.exists(r.report_path):
                os.remove(r.report_path)
        except Exception:
            pass

        try:
            stem, _ = os.path.splitext(r.image_filename or "")
            overlay_path = os.path.join(UPLOAD_DIR, "overlays", f"overlay_{stem}.png")
            if os.path.exists(overlay_path):
                os.remove(overlay_path)
        except Exception:
            pass

        session.delete(r)
        session.commit()

    return Response(status_code=204)


@app.get("/reports")
def list_reports(
    patient_id: Optional[int] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    doctor: Doctor = Depends(get_current_doctor),
):
    # newest first
    with get_session() as session:
        q = select(Report).order_by(desc(Report.created_at))
        if patient_id is not None:
            q = q.where(Report.patient_id == patient_id)

        # totals for pagination
        count_query = select(func.count(Report.id))
        if patient_id is not None:
            count_query = count_query.where(Report.patient_id == patient_id)

        total = session.exec(count_query).one() or 0
        rows = session.exec(q.offset(offset).limit(limit)).all()

        items = []
        for r in rows:
            p = session.get(Patient, r.patient_id)
            d = session.get(Doctor, r.doctor_id)
            items.append({
                "id": r.id,
                "patient_id": r.patient_id,
                "patient_name": f"{p.first_name} {p.last_name}" if p else None,
                "mrn": p.mrn if p else None,
                "doctor_id": r.doctor_id,
                "doctor_name": d.full_name if d else None,
                "image_filename": r.image_filename,
                "result_label": r.result_label,
                "probability": r.probability,
                "report_file": os.path.basename(r.report_path),
                "created_at": r.created_at.isoformat() if r.created_at else None,
            })

        return {"total": int(total), "items": items}


@app.get("/stats")
def stats(doctor: Doctor = Depends(get_current_doctor)):
    # Count totals + today's scans
    with get_session() as session:
        total_patients = session.exec(select(func.count(Patient.id))).one()
        total_reports  = session.exec(select(func.count(Report.id))).one()

        # today (UTC) scans
        now = datetime.now(timezone.utc)
        start_of_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
        today_reports = session.exec(
            select(func.count(Report.id)).where(Report.created_at >= start_of_day)
        ).one()

        return {
            "patients": int(total_patients or 0),
            "reports": int(total_reports or 0),
            "today_scans": int(today_reports or 0),
        }
