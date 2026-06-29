"use client";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import Disclaimer from "../components/Disclaimer";
import heroAnim from "../public/lottie/hero.json";
import scanAnim from "../public/lottie/feature-scan.json";
import reportAnim from "../public/lottie/feature-report.json";
import securityAnim from "../public/lottie/feature-security.json";
import { useEffect, useState } from "react";
import { isAuthed } from "../lib/auth";

export default function HomePage() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => { setAuthed(isAuthed()); }, []);

  return (
    <>
      {/* HERO */}
      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <motion.h1
            className="text-4xl md:text-5xl font-semibold leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            NeuroScan — AI-Assisted MRI Tumor <span className="text-brand-400">Detection</span>
          </motion.h1>
          <motion.p
            className="mt-4 text-white/80"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            Upload MRI images, manage patients securely, and generate polished, downloadable reports — all in one place.
          </motion.p>
          <motion.div
            className="mt-6 flex gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {authed ? (
              <>
                <a href="/upload" className="btn btn-primary">Upload MRI</a>
                <a href="/patients" className="btn">Manage Patients</a>
              </>
            ) : (
              <>
                <a href="/auth/login" className="btn btn-primary">Login</a>
                <a href="/auth/register" className="btn">Register</a>
              </>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="card"
        >
          <Lottie animationData={heroAnim} loop style={{ height: 320 }} />
        </motion.div>
      </section>

      {/* FEATURES (marketing only; no app UI here) */}
      <section className="mt-16 grid md:grid-cols-3 gap-6">
        {[
          { title: "Smart Scans", desc: "Upload MRI images and get AI predictions with confidence scores.", anim: scanAnim },
          { title: "Beautiful Reports", desc: "One-click PDFs with embedded images and professional layout.", anim: reportAnim },
          { title: "Secure & Role-based", desc: "Doctor login, unique MRNs, and audit-ready flows.", anim: securityAnim },
        ].map((f, i) => (
          <motion.div
            key={i}
            className="card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="h-40 flex items-center justify-center">
              <Lottie animationData={f.anim} loop style={{ height: 140 }} />
            </div>
            <div className="text-lg font-semibold mt-2">{f.title}</div>
            <div className="text-white/80 text-sm mt-1">{f.desc}</div>
          </motion.div>
        ))}
      </section>

      <section className="mt-16 card">
        <div className="text-xl font-semibold mb-4">How it works</div>
        <ol className="grid md:grid-cols-4 gap-4 list-decimal list-inside text-white/90">
          <li>Register/Login as a doctor</li>
          <li>Create or select a patient (unique MRN)</li>
          <li>Upload an MRI image and run AI detection</li>
          <li>Download a professional PDF report</li>
        </ol>
      </section>

      <Disclaimer />
    </>
  );
}
