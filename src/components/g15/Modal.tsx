"use client";

import { useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function ModalTrigger({
  label,
  buttonClassName,
  children,
}: {
  label: string;
  buttonClassName: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className={buttonClassName}>
        {label}
      </button>
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="m-auto rounded-2xl border border-slate-200 p-0 shadow-xl backdrop:bg-slate-900/50 open:animate-in open:fade-in open:zoom-in-95"
      >
        <div className="w-[min(680px,90vw)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h3 className="font-semibold text-slate-900">{label}</h3>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="ปิด"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[75vh] overflow-y-auto p-6">{children}</div>
        </div>
      </dialog>
    </>
  );
}
