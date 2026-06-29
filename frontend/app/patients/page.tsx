"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { getToken } from "../../lib/auth";
import Protected from "../../components/Protected";

type Patient = { id:number; first_name:string; last_name:string; dob:string; mrn:string; notes?:string };

function PatientsInner() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [form, setForm] = useState({ first_name:"", last_name:"", dob:"", mrn:"", notes:"" });
  const token = getToken() || "";

  const load = async () => {
    const res = await api("/patients", {}, token);
    if (res.ok) setPatients(await res.json());
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    const res = await api("/patients", { method:"POST", body: JSON.stringify(form) }, token);
    if (res.ok) { setForm({ first_name:"", last_name:"", dob:"", mrn:"", notes:"" }); load(); }
    else alert(await res.text());
  };

  const del = async (id:number) => {
    const res = await api(`/patients/${id}`, { method:"DELETE" }, token);
    if (res.ok) load(); else alert(await res.text());
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-3">Add Patient</h2>
        <div className="space-y-3">
          {["first_name","last_name","dob","mrn","notes"].map((k)=> (
            <div key={k}><input placeholder={k} value={(form as any)[k]} onChange={e=>setForm({...form, [k]: e.target.value})} /></div>
          ))}
          <button className="btn btn-primary" onClick={create}>Create</button>
        </div>
      </div>
      <div className="card">
        <h2 className="text-xl font-semibold mb-3">Patients</h2>
        <ul className="space-y-2">
          {patients.map(p => (
            <li key={p.id} className="border border-white/10 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{p.first_name} {p.last_name}</div>
                <div className="text-sm opacity-70">MRN {p.mrn} — DOB {p.dob}</div>
              </div>
              <button className="btn" onClick={()=>del(p.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function PatientsPage() {
  return <Protected><PatientsInner /></Protected>;
}
