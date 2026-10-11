"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, X } from "lucide-react";

// ปุ่มการ์ดในหน้าจัดการแมทที่กดแล้วเปิดป็อปอัพ (เนื้อหาเป็นฟอร์มจาก server component ส่งมาเป็น children)
// โทรศัพท์ = แผ่นเต็มจอเลื่อนขึ้นจากล่าง, จอใหญ่ = กล่องกลางจอ; เนื้อหาเลื่อนในป็อปอัพ
export function ManageDialogButton({
  title,
  subtitle,
  summary,
  icon,
  tone = "g15",
  children,
}: {
  title: string;
  subtitle?: string;
  summary?: React.ReactNode;
  icon: React.ReactNode;
  tone?: "g15" | "amber" | "sky";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const iconTone = {
    g15: "bg-g15-50 text-g15-600",
    amber: "bg-amber-50 text-amber-500",
    sky: "bg-sky-50 text-sky-600",
  }[tone];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-g15-300 hover:shadow-md sm:p-5"
      >
        <span className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl ${iconTone}`}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-slate-900">
            {title} {subtitle && <span className="font-normal text-slate-400">/ {subtitle}</span>}
          </span>
          {summary && <span className="mt-0.5 block truncate text-sm text-slate-500">{summary}</span>}
        </span>
        <ChevronRight className="h-5 w-5 flex-none text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-g15-500" />
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
          >
            <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-3xl">
              <div className="flex flex-none items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${iconTone}`}>{icon}</span>
                <p className="min-w-0 flex-1 truncate font-semibold text-slate-900">
                  {title} {subtitle && <span className="font-normal text-slate-400">/ {subtitle}</span>}
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="ปิด"
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-y-auto overscroll-contain">{children}</div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
