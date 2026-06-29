import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10">
      <div className="container grid md:grid-cols-4 gap-8 py-10">
        <div>
          <div className="text-lg font-semibold mb-2">
            <span className="text-brand-400">Neuro</span>Scan
          </div>
          <p className="muted">AI-assisted medical imaging workflow for MRI tumor detection, patient management & reporting.</p>
        </div>
        <div>
          <div className="font-semibold mb-2">Product</div>
          <ul className="space-y-2 text-sm opacity-90">
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li><Link href="/patients">Patients</Link></li>
            <li><Link href="/upload">Upload MRI</Link></li>
            <li><Link href="/reports">Reports</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Company</div>
          <ul className="space-y-2 text-sm opacity-90">
            <li><Link href="/">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><a href="#disclaimer">Disclaimer</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Contact</div>
          <p className="text-sm opacity-90">Email: support@medvision.local</p>
          <p className="text-sm opacity-90">Phone: +91-00000-00000</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container py-4 text-xs opacity-70">© {new Date().getFullYear()} NeuroScan. All rights reserved.</div>
      </div>
    </footer>
  );
}
