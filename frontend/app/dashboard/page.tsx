"use client";

import { useEffect, useState } from "react";
import Protected from "../../components/Protected";
import { api } from "../../lib/api";
import { getToken } from "../../lib/auth";

type Stats = {
  patients: number;
  reports: number;
  today_scans: number;
};

function DashboardInner() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken() || "";
    (async () => {
      const res = await api("/stats", {}, token);
      if (!res.ok) {
        setErr(await res.text());
        return;
      }
      const data = (await res.json()) as Stats;
      setStats(data);
    })();
  }, []);

  return (
    <>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card">
          <div className="text-sm opacity-70">Today's Scans</div>
          <div className="text-3xl font-semibold">{stats ? stats.today_scans : "…"}</div>
        </div>

        <div className="card">
          <div className="text-sm opacity-70">Patients</div>
          <div className="text-3xl font-semibold">{stats ? stats.patients : "…"}</div>
        </div>

        <div className="card">
          <div className="text-sm opacity-70">Total Reports</div>
          <div className="text-3xl font-semibold">{stats ? stats.reports : "…"}</div>
        </div>
      </div>

      {err && <div className="card mt-6 text-red-300">Failed to load stats: {err}</div>}
    </>
  );
}

export default function DashboardPage() {
  return (
    <Protected>
      <DashboardInner />
    </Protected>
  );
}
