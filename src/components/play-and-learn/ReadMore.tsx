"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// ย่อหน้าที่เหลือของ "แนะนำโครงการ" — ซ่อนไว้ก่อน กดแล้วกางออกนุ่มๆ (เนื้อหายังอยู่ในหน้าให้ค้นหา/อ่านด้วยโปรแกรมอ่านหน้าจอได้)
export function ReadMore({ count, children }: { count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden" inert={!open} data-readmore-body>
          <div className="space-y-5 pt-5">{children}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group mt-5 inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-4 py-2 text-sm font-bold text-pink-600 ring-1 ring-pink-100 transition-colors hover:bg-pink-100"
      >
        {open ? "ย่อข้อความ" : `อ่านต่ออีก ${count} ย่อหน้า`}
        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : "group-hover:translate-y-0.5"}`} />
      </button>
    </>
  );
}
