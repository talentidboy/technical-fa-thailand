"use client";

import { useState } from "react";
import { Check, Search } from "lucide-react";
import { fieldClass } from "./AcademyShell";

export type PickerAcademy = { id: number; nameEn: string; nameTh: string | null; province: string | null };

// ค้นหาแล้วเลือกอคาเดมีจากทะเบียน (ส่งค่าเป็น id ผ่าน hidden input)
export function AcademyPicker({
  name,
  academies,
  initial = null,
  emptyHint,
}: {
  name: string;
  academies: PickerAcademy[];
  initial?: PickerAcademy | null;
  emptyHint?: string;
}) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<PickerAcademy | null>(initial);
  const query = q.trim().toLowerCase();
  const matches = query.length >= 2 ? academies.filter((a) => [a.nameEn, a.nameTh].some((v) => v?.toLowerCase().includes(query))).slice(0, 8) : [];

  return (
    <div>
      <input type="hidden" name={name} value={picked?.id ?? ""} />
      {picked ? (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 ring-1 ring-indigo-200">
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 text-indigo-600" />
            <span>
              <span className="block font-semibold text-slate-900">{picked.nameEn}</span>
              <span className="block text-xs text-slate-500">{[picked.nameTh, picked.province].filter(Boolean).join(" · ")}</span>
            </span>
          </span>
          <button type="button" onClick={() => setPicked(null)} className="text-xs font-semibold text-indigo-600 hover:underline">
            เปลี่ยน
          </button>
        </div>
      ) : (
        <>
          <label className="relative block">
            <span className="sr-only">ค้นหาชื่ออคาเดมี</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="พิมพ์ชื่ออคาเดมีอย่างน้อย 2 ตัวอักษร" className={`${fieldClass} pl-9`} />
          </label>
          {matches.length > 0 && (
            <ul className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
              {matches.map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => setPicked(a)} className="w-full px-3 py-2 text-left hover:bg-indigo-50">
                    <span className="block text-sm font-semibold text-slate-900">{a.nameEn}</span>
                    <span className="block text-xs text-slate-500">{[a.nameTh, a.province].filter(Boolean).join(" · ")}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {query.length >= 2 && matches.length === 0 && <p className="mt-2 text-xs text-slate-500">{emptyHint ?? "ไม่พบชื่อนี้ในทะเบียน"}</p>}
        </>
      )}
    </div>
  );
}
