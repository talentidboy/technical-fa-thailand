"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

// คัดลอกลิงก์สมัครของรุ่น (เต็ม URL ของเว็บที่เปิดอยู่) ไปวางประกาศใน Facebook / LINE
export function CopyLinkButton({ path, className, label = "คัดลอกลิงก์สมัคร" }: { path: string; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const url = new URL(path, window.location.origin).toString();
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          window.prompt("คัดลอกลิงก์นี้", url);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
      }
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "คัดลอกแล้ว" : label}
    </button>
  );
}
