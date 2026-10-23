"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import styles from "./ThailandMap.module.css";

// ปุ่มเปิดกล่องข้อความ — เก็บรายละเอียดยาวๆ ไว้หลังปุ่มแทนการวางเต็มหน้า
export function InfoDialog({ label, title, className, children }: { label: React.ReactNode; title: string; className?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className={className}>
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-indigo-950/60 p-4 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            className={`${styles.sheet} relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 text-slate-700 shadow-2xl sm:p-8`}
          >
            <button type="button" onClick={() => setOpen(false)} aria-label="ปิด" className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
            <h2 className="pr-8 text-xl font-extrabold text-slate-900">{title}</h2>
            <div className="mt-4">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
