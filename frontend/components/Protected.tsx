"use client";

import { useEffect, useState } from "react";
import { isAuthed } from "../lib/auth";
import { useRouter } from "next/navigation";

export default function Protected({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthed()) {
      router.replace("/auth/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="card">
        <div className="animate-pulse text-white/70">Checking authentication…</div>
      </div>
    );
  }

  return <>{children}</>;
}
