"use client";

import { useState } from "react";

// ปุ่มคำสั่งเรียงแถว — กดแล้วเปิดแผงฟอร์มของคำสั่งนั้นด้านล่าง (เปิดได้ทีละแผง)
export function ActionSwitch({ items }: { items: { key: string; label: string; danger?: boolean; content: React.ReactNode }[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const current = items.find((i) => i.key === open);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <button
            key={i.key}
            type="button"
            aria-expanded={open === i.key}
            onClick={() => setOpen(open === i.key ? null : i.key)}
            className={`rounded-md border px-3.5 py-2 text-sm font-semibold transition-colors ${
              open === i.key
                ? i.danger
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-[#0b1f44] bg-[#0b1f44] text-white"
                : i.danger
                  ? "border-red-200 bg-white text-red-600 hover:bg-red-50"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {i.label}
          </button>
        ))}
      </div>
      {current && <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">{current.content}</div>}
    </div>
  );
}
