"use client";

import { useRef, useState } from "react";
import { CheckCircle2, PencilLine, Save, XCircle } from "lucide-react";
import { ResultForm } from "@/components/ResultForm";
import { reviewEvidence } from "@/app/academies/manage/review-actions";
import { fieldClass } from "@/components/academy/AcademyShell";

const OPTIONS = [
  { value: "PASS", label: "ผ่าน", icon: CheckCircle2, on: "has-checked:bg-emerald-600 has-checked:text-white has-checked:ring-emerald-600" },
  { value: "FIX", label: "ต้องแก้ไข", icon: PencilLine, on: "has-checked:bg-amber-500 has-checked:text-white has-checked:ring-amber-500" },
  { value: "FAIL", label: "ไม่ผ่าน", icon: XCircle, on: "has-checked:bg-red-600 has-checked:text-white has-checked:ring-red-600" },
] as const;

const HINT: Record<string, string> = {
  PASS: "ข้อนี้ผ่านเกณฑ์ — เขียนความเห็นเพิ่มได้ (ไม่บังคับ)",
  FIX: "อคาเดมีจะเห็นข้อความนี้และแก้ไขส่งกลับมาได้ — บอกให้ชัดว่าต้องแก้อะไร และแก้อย่างไร",
  FAIL: "ข้อนี้ไม่ผ่านตามเกณฑ์ — ระบุเหตุผลให้อคาเดมีทราบ",
};

// ข้อความสำเร็จรูป กดแล้วเติมลงช่องความเห็น (แก้ต่อได้)
const PRESETS = [
  "แนบเอกสารหลักฐานเพิ่มเติม",
  "เอกสารไม่ชัดเจน อ่านไม่ออก — ขอไฟล์ที่ชัดกว่านี้",
  "เอกสารหมดอายุ — ขอฉบับปัจจุบัน",
  "ขาดลายมือชื่อ / ตราประทับ",
  "ข้อมูลไม่ตรงกับเกณฑ์ข้อนี้",
  "ขอคำอธิบายเพิ่มเติม",
];

// ฟอร์มตรวจหนึ่งข้อในหน้าตรวจใบสมัคร (แอดมิน): เลือกผล → เขียนสิ่งที่ต้องแก้ → บันทึก
export function EvidenceReview({ id, code, status, reviewNote }: { id: number; code: string; status: string; reviewNote: string | null }) {
  const [choice, setChoice] = useState(status === "PENDING" ? "" : status);
  const note = useRef<HTMLTextAreaElement>(null);
  const add = (text: string) => {
    const el = note.current;
    if (!el) return;
    el.value = el.value.trim() ? `${el.value.trim()}\n${text}` : text;
    el.focus();
  };
  const needsReason = choice === "FIX" || choice === "FAIL";

  return (
    <ResultForm action={reviewEvidence} quiet className="mt-4 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <input type="hidden" name="id" value={id} />
      <p className="text-xs font-bold text-slate-500">ผลการตรวจข้อ {code}</p>
      <div role="radiogroup" aria-label={`ผลตรวจข้อ ${code}`} className="mt-2 grid grid-cols-3 gap-1.5 sm:max-w-md">
        {OPTIONS.map(({ value, label, icon: Icon, on }) => (
          <label
            key={value}
            className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-white px-2 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-300 transition-colors hover:bg-slate-100 ${on}`}
          >
            <input type="radio" name="status" value={value} defaultChecked={status === value} onChange={() => setChoice(value)} className="sr-only" />
            <Icon className="h-4 w-4 flex-none" aria-hidden />
            {label}
          </label>
        ))}
      </div>
      <p className={`mt-2 text-xs ${needsReason ? "font-semibold text-amber-800" : "text-slate-500"}`}>{HINT[choice] ?? "เลือกผลการตรวจของข้อนี้ แล้วกดบันทึกผล"}</p>
      {needsReason && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button key={p} type="button" onClick={() => add(p)} className="rounded-lg bg-white px-2.5 py-1 text-xs text-slate-700 ring-1 ring-amber-300 hover:bg-amber-50">
              + {p}
            </button>
          ))}
        </div>
      )}
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
        <textarea
          ref={note}
          name="reviewNote"
          rows={2}
          defaultValue={reviewNote ?? ""}
          placeholder={needsReason ? "ต้องแก้อะไร / แก้อย่างไร (อคาเดมีจะเห็นข้อความนี้)" : "ความเห็น (ไม่บังคับ)"}
          className={`${fieldClass} min-w-0 flex-1 py-2`}
        />
        <button
          type="submit"
          aria-label={`บันทึกผลข้อ ${code}`}
          className="inline-flex flex-none items-center justify-center gap-1.5 rounded-xl bg-[#1e96dc] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0b6cb0]"
        >
          <Save className="h-4 w-4" />
          บันทึกผล
        </button>
      </div>
    </ResultForm>
  );
}
