"use client";
import { useState } from "react";
import { api } from "../../../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    const res = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    if (!res.ok) return alert(await res.text());
    const data = await res.json();
    localStorage.setItem("token", data.token);
    alert("Logged in");
    window.location.href = "/dashboard";
  };

  return (
    <div className="max-w-md mx-auto card">
      <h1 className="text-2xl font-semibold mb-4">Doctor Login</h1>
      <div className="space-y-3">
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn btn-primary w-full" onClick={login}>Login</button>
      </div>
      <p className="muted mt-3">
        Don’t have an account? <a className="underline" href="/auth/register">Register</a>
      </p>
    </div>
  );
}
