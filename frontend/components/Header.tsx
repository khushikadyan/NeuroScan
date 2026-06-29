"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthed, logout } from "../lib/auth";

export default function Header() {
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(isAuthed());
  }, []);

  const publicNav = [
    { href: "/", label: "Home" },
    { href: "/contact", label: "Contact" },
    { href: "/auth/login", label: "Login" },
    { href: "/auth/register", label: "Register" },
  ];

  const privateNav = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/patients", label: "Patients" },
    { href: "/upload", label: "Upload MRI" },
    { href: "/reports", label: "Reports" },
    { href: "/contact", label: "Contact" },
  ];

  const nav = authed ? privateNav : publicNav;

  return (
    <header className="border-b border-white/10 sticky top-0 backdrop-blur z-50">
      <div className="container flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/logo.png" width={150} height={150} alt="NeuroScan logo" className="rounded-lg" />
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="relative px-3 py-2 rounded-xl hover:bg-white/10">
                <span className="opacity-90">{item.label}</span>
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl border border-brand-400/40"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
          {authed && (
            <button className="btn ml-2" onClick={logout}>
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
