"use client";

import { useEffect, useMemo, useState } from "react";
import Protected from "../../components/Protected";
import { api } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { API_BASE } from "../../lib/config";

type Patient = {
  id: number;
  first_name: string;
  last_name: string;
  mrn: string;
};

type ReportItem = {
  id: number;
  patient_id: number;
  patient_name: string | null;
  mrn: string | null;
  doctor_name: string | null;
  image_filename: string;
  result_label: string;
  probability: number;
  report_file: string; // filename for /reports/{report_file}
  created_at: string | null;
};

export default function ReportsPage() {
  return (
    <Protected>
      <ReportsInner />
    </Protected>
  );
}

function ReportsInner() {
  const token = getToken() || "";
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState<number | "">("");
  const [items, setItems] = useState<ReportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const offset = useMemo(() => (page - 1) * limit, [page, limit]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Load patients for filter
  useEffect(() => {
    (async () => {
      const res = await api("/patients", {}, token);
      if (res.ok) setPatients(await res.json());
    })();
  }, [token]);

  // Fetch reports
  async function loadReports() {
    setLoading(true);
    setErr(null);

    const qs = new URLSearchParams();
    qs.set("limit", String(limit));
    qs.set("offset", String(offset));
    if (patientId !== "") qs.set("patient_id", String(patientId));

    const res = await api(`/reports?${qs.toString()}`, {}, token);
    if (!res.ok) {
      setErr(await res.text());
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, limit, page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Download with Authorization header
  async function downloadReport(reportFile: string, fallbackName?: string) {
    const tok = getToken() || "";
    const url = `${API_BASE}/reports/${reportFile}`;

    const res = await fetch(url, { method: "GET", headers: { Authorization: tok } });
    if (!res.ok) {
      const errText = await res.text();
      alert(`Failed to download: ${errText}`);
      return;
    }
    const blob = await res.blob();

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
  }

  // Delete report, then refresh list
  async function deleteReport(id: number) {
    const tok = getToken() || "";
    const ok = confirm("Delete this report permanently?");
    if (!ok) return;

    const res = await api(`/reports/id/${id}`, { method: "DELETE" }, tok);
    if (!res.ok) {
      const text = await res.text();
      alert(`Failed to delete: ${text}`);
      return;
    }
    loadReports();
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-3">Reports</h2>

        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="text-sm opacity-80">Patient</label>
            <select
              className="w-full bg-white/10 border border-white/20 rounded-xl p-2"
              value={patientId}
              onChange={(e) => {
                setPage(1);
                setPatientId(e.target.value === "" ? "" : Number(e.target.value));
              }}
            >
              <option value="">All patients</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} ({p.mrn})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm opacity-80">Page size</label>
            <select
              className="w-full bg-white/10 border border-white/20 rounded-xl p-2"
              value={limit}
              onChange={(e) => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              className="btn"
              disabled={loading || page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <div className="text-sm opacity-80">
              Page <span className="font-medium">{page}</span> / {totalPages}
            </div>
            <button
              className="btn"
              disabled={loading || page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>

          <div className="flex items-end">
            <button className="btn btn-primary" disabled={loading} onClick={loadReports}>
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {err && <div className="card text-red-300">Failed to load reports: {err}</div>}

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left opacity-80">
            <tr>
              <th className="py-2">Created</th>
              <th className="py-2">Patient</th>
              <th className="py-2">MRN</th>
              <th className="py-2">Result</th>
              <th className="py-2">Confidence</th>
              <th className="py-2">Image</th>
              <th className="py-2">Report</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="py-2">{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</td>
                <td className="py-2">{r.patient_name ?? "—"}</td>
                <td className="py-2">{r.mrn ?? "—"}</td>
                <td className="py-2 capitalize">{r.result_label}</td>
                <td className="py-2">{(r.probability ?? 0).toFixed(3)}</td>
                <td className="py-2">{r.image_filename}</td>
                <td className="py-2">
                  <button
                    className="btn"
                    onClick={() => downloadReport(r.report_file, `report_${r.id}.pdf`)}
                  >
                    Download
                  </button>
                </td>
                <td className="py-2">
                  <button
                    className="btn"
                    onClick={() => deleteReport(r.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {items.length === 0 && !loading && (
              <tr>
                <td className="py-4 text-white/70" colSpan={8}>
                  No reports yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs opacity-70">
        Showing {(items?.length || 0)} of {total} result(s). Page {page}/{totalPages}.
      </div>
    </div>
  );
}
