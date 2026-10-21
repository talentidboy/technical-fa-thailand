"use client";

import { useState, useTransition } from "react";
import { renewLicenses } from "@/app/(admin)/renewals/actions";
import { renewedExpiry, thaiDate, todayThai, formatThaiDate, RENEWAL_YEARS } from "@/lib/license-renewal";
import { RefreshCw } from "lucide-react";

// ปุ่มต่ออายุใบเดียว (หน้าประวัติโค้ช) — กดแล้วกางช่องวันที่/อายุ พร้อมพรีวิววันหมดอายุใหม่
export function RenewOneButton({ recordId, expireIso, nowIso }: { recordId: number; expireIso: string | null; nowIso: string }) {
  const today = todayThai(new Date(nowIso));
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today);
  const [years, setYears] = useState(RENEWAL_YEARS);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const d = thaiDate(date);
  const next = d ? renewedExpiry(expireIso ? new Date(expireIso) : null, d, years) : null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="ต่ออายุใบอนุญาต"
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        ต่ออายุ
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 rounded-xl bg-emerald-50 p-2 text-left ring-1 ring-emerald-200">
      <input
        type="date"
        value={date}
        max={today}
        onChange={(e) => setDate(e.target.value)}
        aria-label="วันที่ต่ออายุ"
        className="rounded-lg border border-emerald-200 bg-white px-2 py-1 text-xs"
      />
      <select
        value={years}
        onChange={(e) => setYears(Number(e.target.value))}
        aria-label="อายุใบอนุญาต"
        className="rounded-lg border border-emerald-200 bg-white px-2 py-1 text-xs"
      >
        {[1, 2, 3, 4, 5].map((y) => (
          <option key={y} value={y}>
            {y} ปี
          </option>
        ))}
      </select>
      {next && <span className="text-xs font-semibold text-emerald-800">→ {formatThaiDate(next)}</span>}
      <button
        type="button"
        disabled={pending || !d}
        onClick={() =>
          startTransition(async () => {
            const res = await renewLicenses({ recordIds: [recordId], requestIds: [], date, years, note: "" });
            if (res.ok) setOpen(false);
            else setError(res.error);
          })
        }
        className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? "..." : "ยืนยัน"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="px-1 text-xs text-slate-500 hover:text-slate-800">
        ยกเลิก
      </button>
      {error && <p className="w-full text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
