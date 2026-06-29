# 🧠 NeuroScan — Brain Tumor Detection System

A production-grade medical imaging platform that uses deep learning (ResNet50) to detect brain tumors from MRI scans. Designed for clinical workflows with doctor authentication, patient management, AI-powered inference, Grad-CAM heatmap visualization, and automated PDF report generation.

---

## ✨ Features

- 🔐 **Doctor Authentication** — JWT-based login & registration with PBKDF2 password hashing
- 🧑‍⚕️ **Patient Management** — Full CRUD for patient records with Medical Record Numbers (MRN)
- 🤖 **AI Inference** — ResNet50 model trained to 99.33% accuracy on brain MRI classification (tumor / no tumor)
- 🌡️ **Grad-CAM Heatmaps** — Visual explanation of model predictions overlaid on MRI scans
- 📄 **PDF Report Generation** — Professional single-page reports with patient info, prediction, probability, and heatmap
- 📊 **Dashboard** — Live stats: total patients, reports generated, and today's scans
- 📁 **Report History** — Paginated, filterable report listing with direct PDF download

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | FastAPI, Python, Uvicorn |
| **ML / AI** | TensorFlow 2.20, Keras 3.12, ResNet50, OpenCV |
| **Database** | PostgreSQL, SQLModel (SQLAlchemy + Pydantic) |
| **Auth** | JWT, Passlib (PBKDF2-SHA256) |
| **Reports** | ReportLab (PDF generation) |

---

## 📁 Project Structure

```
medvision/
├── backend/
│   └── app/
│       ├── main.py              # FastAPI app & all API routes
│       ├── database.py          # Database connection & table models
│       ├── schemas.py           # Pydantic request/response schemas
│       ├── auth.py              # JWT & password hashing
│       ├── model_tf.py          # Model loading & inference
│       ├── report_pdf.py        # PDF report generation
│       ├── models/              # Pre-trained model weights (.h5)
│       ├── uploads/             # Uploaded MRI images
│       ├── reports/             # Generated PDF reports
│       └── vision/
│           ├── preprocess.py    # MRI cropping & preprocessing
│           └── gradcam.py       # Grad-CAM heatmap generation
├── frontend/
│   └── app/
│       ├── page.tsx             # Marketing homepage
│       ├── dashboard/           # Stats dashboard
│       ├── auth/                # Login & registration
│       ├── patients/            # Patient management
│       ├── upload/              # MRI upload & detection
│       └── reports/             # Report history & download
├── brain-tumor-detection-resnet50.ipynb   # Model training notebook
├── START_ALL.bat                # Launch all services (Windows)
├── START_BACKEND.bat
├── START_FRONTEND.bat
└── START_DATABASE.bat
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### 1. Clone the repository

```bash
git clone https://github.com/khushikadyan/NeuroScan-brain-Tumor-Detection-System.git
cd NeuroScan-brain-Tumor-Detection-System
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
DATABASE_URL=postgresql+psycopg://postgres:yourpassword@localhost:5432/medvision
JWT_SECRET=your_secret_key_here
CORS_ORIGINS=http://localhost:3000
```

### 3. Download the model

Download `resnet50_brain.h5` and place it at:

```
backend/app/models/resnet50_brain.h5
```

> The model file is tracked via Git LFS — run `git lfs pull` after cloning.

### 4. Frontend setup

```bash
cd frontend
npm install
npm run build
```

### 5. Run the application

**Windows (all-in-one):**
```
START_ALL.bat
```

**Manually:**
```bash
# Terminal 1 — PostgreSQL (ensure it is running on port 5432)

# Terminal 2 — Backend
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 3 — Frontend
cd frontend
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register a new doctor account |
| `POST` | `/auth/login` | Login and receive JWT token |
| `POST` | `/patients` | Create a new patient |
| `GET` | `/patients` | List all patients |
| `PATCH` | `/patients/{id}` | Update patient details |
| `DELETE` | `/patients/{id}` | Delete a patient |
| `POST` | `/inference` | Upload MRI → run detection → generate PDF report |
| `GET` | `/reports` | List all reports (paginated, filterable) |
| `GET` | `/reports/{file}` | Download a PDF report |
| `DELETE` | `/reports/id/{id}` | Delete a report |
| `GET` | `/stats` | Dashboard statistics |
| `GET` | `/health` | Health check |

Interactive API docs available at [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🤖 Model Performance

The ResNet50 model was fine-tuned on a brain MRI dataset (1,800 training / 600 validation / 600 test images).

| Metric | Score |
|--------|-------|
| **Test Accuracy** | 99.33% |
| **Precision** | 0.9934 |
| **Recall** | 0.9933 |
| **F1 Score** | 0.9933 |
| **ROC AUC** | 0.9986 |
| **Cohen's Kappa** | 0.9867 |

> **Disclaimer:** This system is intended for research and assistive purposes only. It is not a substitute for professional medical diagnosis.

---

## 📜 License

This project is for educational and research use only.
