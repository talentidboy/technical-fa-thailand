"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./ThailandMap.module.css";
import { academyFont, academyPoster } from "@/components/typefaces/academy";

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
  // วางกล่องไว้ที่ <body> เสมอ — ถ้าอยู่ในกล่องที่มี transform (เช่น การ์ดที่กำลังเล่นอนิเมชัน) position: fixed จะติดอยู่ในกล่องนั้น
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

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
      {open &&
        mounted &&
        createPortal(
        <div className={`${academyFont.className} fixed inset-0 z-50 flex items-end justify-center bg-[#0b1220]/60 sm:items-center sm:p-4`} onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            className={`${styles.sheet} relative max-h-[92svh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 text-slate-700 shadow-2xl sm:rounded-3xl sm:p-8 ${wide ? "sm:max-w-5xl" : "sm:max-w-lg"}`}
          >
            <button type="button" onClick={close} aria-label="ปิด" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-[#ffd426] hover:text-[#0b1220]">
              <X className="h-5 w-5" />
            </button>
            <h2 className={`${academyPoster.className} pr-10 text-2xl font-bold text-[#0b1220] sm:text-3xl`}>{title}</h2>
            <span aria-hidden className="mt-2 block h-1.5 w-14 rounded-full bg-[#ffd426]" />
            <div className="mt-4">{children}</div>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
