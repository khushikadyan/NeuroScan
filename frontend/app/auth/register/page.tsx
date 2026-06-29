"use client";
import { useState } from "react";
import { api } from "../../../lib/api";


export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    const res = await api("/auth/register", { method: "POST", body: JSON.stringify({ email, full_name: fullName, password }) });
    if (!res.ok) return alert(await res.text());
    alert("Registered! Please log in.");
    window.location.href = "/auth/login";
  };

  return (
    <div className="max-w-md mx-auto card">
      <h1 className="text-2xl font-semibold mb-4">Doctor Registration</h1>
      <div className="space-y-3">
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Full name" value={fullName} onChange={e=>setFullName(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn btn-primary w-full" onClick={register}>Create account</button>
      </div>
      <p className="muted mt-3">
        Already have an account? <a className="underline" href="/auth/login">Login</a>
      </p>
    </div>
  );
}
