"use client";

import { useEffect, useState } from "react";
import Protected from "../../components/Protected";
import { api } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { API_BASE } from "../../lib/config";

type Patient = { id:number; first_name:string; last_name:string };

function UploadInner() {
  const [file, setFile] = useState<File | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [result, setResult] = useState<any>(null);
  const token = getToken() || "";

  useEffect(() => {
    (async () => {
      const res = await api("/patients", {}, token);
      if (res.ok) setPatients(await res.json());
    })();
  }, [token]);

  const submit = async () => {
    if (!file || !patientId) return alert("Select a file and patient");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("patient_id", String(patientId));
    const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000") + "/inference", {
      method: "POST",
      headers: { Authorization: token }, // backend expects raw token
      body: fd
    });
    if (!res.ok) return alert(await res.text());
    const data = await res.json();
    setResult(data);
  };

  // Download with Authorization header (no new tab link)
  const downloadReport = async (reportFile: string, fallbackName?: string) => {
    const tok = getToken() || "";
    const url = `${API_BASE}/reports/${reportFile}`;
    const res = await fetch(url, { method: "GET", headers: { Authorization: tok } });
    if (!res.ok) {
      const errText = await res.text();
      alert(`Failed to download: ${errText}`);
      return;
    }
    const blob = await res.blob();

    // try to get filename from Content-Disposition
    const cd = res.headers.get("content-disposition") || "";
    let filename = fallbackName || reportFile;
    const match = /filename\*?=(?:UTF-8'')?("?)([^";]+)\1/i.exec(cd);
    if (match && match[2]) filename = decodeURIComponent(match[2]);

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="card space-y-4">
      <h2 className="text-xl font-semibold">Upload MRI and Run Detection</h2>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm opacity-80">Patient</label>
          <select
            onChange={(e)=>setPatientId(Number(e.target.value))}
            defaultValue=""
            className="w-full bg-white/10 border border-white/20 rounded-xl p-2"
          >
            <option value="" disabled>Select patient</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm opacity-80">MRI Image</label>
          <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
        </div>

        <div className="flex items-end">
          <button className="btn btn-primary" onClick={submit}>Run</button>
        </div>
      </div>

      {result && (
        <div className="border border-white/10 rounded-xl p-4 space-y-2">
          <div className="font-medium">
            Result: {result.label} (prob {(Number(result.probability ?? result.confidence) * 100).toFixed(1)}%)
          </div>
          {"report_file" in result && (
            <button
              className="btn"
              onClick={() => downloadReport(result.report_file, `report_${result.report_id || "latest"}.pdf`)}
            >
              Download Report
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function UploadPage() {
  return (
    <Protected>
      <UploadInner />
    </Protected>
  );
}
