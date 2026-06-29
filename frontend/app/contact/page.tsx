"use client";
import { useState } from "react";

export default function ContactPage(){
  const [form, setForm] = useState({ name:"", email:"", message:"" });
  const submit = () => {
    const mailto = `mailto:support@medvision.local?subject=Contact%20from%20${encodeURIComponent(form.name)}&body=${encodeURIComponent(form.message + "\n\nFrom: " + form.email)}`;
    window.location.href = mailto;
  };
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
        <p className="text-white/80 text-sm mb-4">Questions, partnerships, or feedback — we’d love to hear from you.</p>
        <div className="space-y-3">
          <input placeholder="Your name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          <input placeholder="Your email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
          <textarea placeholder="Your message" rows={6} value={form.message} onChange={e=>setForm({...form, message:e.target.value})} />
          <button className="btn btn-primary" onClick={submit}>Send</button>
        </div>
      </div>
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Our Offices</h3>
        <p className="text-white/80 text-sm">Delhi, India</p>
        <p className="text-white/80 text-sm">Email: support@medvision.local</p>
        <p className="text-white/80 text-sm">Phone: +91-00000-00000</p>
      </div>
    </div>
  );
}
