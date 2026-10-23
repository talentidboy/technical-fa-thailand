"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import styles from "./ThailandMap.module.css";
import { display } from "./fonts";

function removeParam(name: string) {
  const url = new URL(window.location.href);
  url.searchParams.delete(name);
  url.hash = "";
  window.history.replaceState(null, "", url);
}

// ปุ่มเปิดกล่องข้อความ — เก็บรายละเอียดยาวๆ ไว้หลังปุ่มแทนการวางเต็มหน้า
// defaultOpen + clearParam = เปิดจากลิงก์ (เช่น ?criteria=GOLD) แล้วลบพารามิเตอร์ออกจาก URL ตอนปิด จะได้ไม่เด้งซ้ำเมื่อรีเฟรช
export function InfoDialog({
  label,
  title,
  className,
  wide = false,
  defaultOpen = false,
  clearParam,
  children,
}: {
  label?: React.ReactNode;
  title: string;
  className?: string;
  wide?: boolean;
  defaultOpen?: boolean;
  clearParam?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  function close() {
    setOpen(false);
    if (clearParam) removeParam(clearParam);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      if (clearParam) removeParam(clearParam);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, clearParam]);

  return (
    <>
      {label && (
        <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className={className}>
          {label}
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-4" onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            className={`${styles.sheet} relative max-h-[92svh] w-full overflow-y-auto rounded-t-lg bg-white p-6 text-slate-700 shadow-2xl sm:rounded-lg sm:p-8 ${wide ? "sm:max-w-5xl" : "sm:max-w-lg"}`}
          >
            <button type="button" onClick={close} aria-label="ปิด" className="absolute right-4 top-4 rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
            <h2 className={`${display.className} border-b border-slate-200 pb-3 pr-8 text-2xl font-semibold text-slate-900`}>{title}</h2>
            <div className="mt-4">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
