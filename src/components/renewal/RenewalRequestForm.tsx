"use client";

import { useActionState, useState } from "react";
import { requestRenewal, type RenewalRequestState } from "@/app/me/renewal-actions";
import { RefreshCw, Loader2, AlertCircle, CheckCircle2, ImagePlus } from "lucide-react";

// ปุ่ม "ขอต่ออายุ" ในการ์ดใบอนุญาตของโค้ช — กดแล้วกางฟอร์ม (กิจกรรม CPD + แนบรูปหลักฐาน)
export function RenewalRequestForm({ recordId, licenseLabel }: { recordId: number; licenseLabel: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<RenewalRequestState, FormData>(requestRenewal, null);
  const [fileName, setFileName] = useState<string | null>(null);

  if (state?.ok) {
    return (
      <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-none" />
        {state.message}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-amber-200 transition-colors hover:bg-amber-600"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        ขอต่ออายุใบอนุญาต
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-3 space-y-3 rounded-2xl bg-amber-50/60 p-3 ring-1 ring-amber-200">
      <input type="hidden" name="recordId" value={recordId} />
      <label className="block">
        <span className="text-xs font-semibold text-slate-700">กิจกรรม/การอบรมพัฒนาความรู้ (CPD) ที่เข้าร่วมช่วงที่ถือใบอนุญาต {licenseLabel}</span>
        <textarea
          name="note"
          required
          minLength={5}
          maxLength={1000}
          rows={3}
          placeholder="เช่น สัมมนาผู้ฝึกสอนประจำปี 2569 (8 ชม.), คุมทีมในลีกเยาวชน..."
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
      </label>
      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 hover:border-amber-400">
        <ImagePlus className="h-4 w-4 flex-none text-slate-400" />
        <span className="truncate">{fileName ?? "แนบรูปหลักฐาน เช่น ใบประกาศ CPD (ไม่บังคับ · JPG/PNG ไม่เกิน 5MB)"}</span>
        <input
          type="file"
          name="evidence"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>
      {state && !state.ok && (
        <p role="alert" className="flex items-start gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-none" />
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          ส่งคำขอ
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-white">
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
