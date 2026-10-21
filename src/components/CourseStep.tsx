"use client";

import { useState } from "react";
import { ChevronDown, Clock, CalendarDays, BookOpen, Users } from "lucide-react";
import type { CoreStep } from "@/lib/coach-program";
import { display, levelTone } from "@/components/coach/CoachUi";

export type { CoreStep };

// ขั้นในเส้นเวลา AFC Core Program — ป้ายระดับบนราวด้านซ้าย + การ์ดกดขยายดูรายละเอียด
export function CourseStep({ step, index, last }: { step: CoreStep; index: number; last?: boolean }) {
  const [open, setOpen] = useState(index === 0);
  const tone = levelTone(step.level);
  const parts = [
    { label: "ทฤษฎี", hours: step.theoryHours, cls: "bg-indigo-600" },
    { label: "ปฏิบัติ", hours: step.practicalHours, cls: "bg-sky-400" },
    { label: "ประสบการณ์/ดูงาน", hours: step.experienceHours, cls: "bg-amber-400" },
  ];
  const total = parts.reduce((s, p) => s + p.hours, 0) || 1;

  return (
    <li className="relative grid grid-cols-[3.5rem_1fr] gap-4 sm:grid-cols-[4.5rem_1fr] sm:gap-6">
      {/* ราวเส้นเวลา */}
      <div className="relative flex justify-center">
        {!last && <span aria-hidden className="absolute top-14 -bottom-5 w-0.5 bg-linear-to-b from-slate-300 to-slate-200 sm:top-16" />}
        <span
          className={`${display.className} relative flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br text-lg font-black text-white shadow-lg ring-4 ring-slate-50 sm:h-16 sm:w-16 sm:text-xl ${tone.bar}`}
        >
          {step.level}
        </span>
      </div>

      <div className={`overflow-hidden rounded-3xl bg-white shadow-sm ring-1 transition-shadow ${open ? "shadow-md ring-slate-300" : "ring-slate-200 hover:shadow-md"}`}>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-start justify-between gap-3 p-5 text-left">
          <div className="min-w-0">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${tone.text}`}>ขั้นที่ {index + 1}</p>
            <h3 className="text-lg font-extrabold leading-snug text-slate-900">{step.title}</h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
              <Users className="h-3.5 w-3.5 flex-none" />
              {step.ageGroup}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${tone.soft}`}>
                <Clock className="h-3.5 w-3.5" />
                {step.totalHours} ชั่วโมง
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${tone.soft}`}>
                <CalendarDays className="h-3.5 w-3.5" />
                {step.days} วัน
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${tone.soft}`}>
                <BookOpen className="h-3.5 w-3.5" />
                {step.subjects.length} รายวิชา
              </span>
            </div>
          </div>
          <span className={`mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}>
            <ChevronDown className="h-4 w-4" />
          </span>
        </button>

        {open && (
          <div className="space-y-5 border-t border-slate-100 bg-slate-50/60 p-5">
            <p className="text-sm leading-relaxed text-slate-600">{step.description}</p>

            {/* สัดส่วนชั่วโมงเรียน */}
            <div>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-200">
                {parts.map((p) => (
                  <div key={p.label} className={`${p.cls} h-full border-r-2 border-white last:border-r-0`} style={{ width: `${(p.hours / total) * 100}%` }} />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                {parts.map((p) => (
                  <span key={p.label} className="inline-flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-sm ${p.cls}`} />
                    {p.label} <b className="text-slate-900">{p.hours}</b> ชม.
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-slate-500">รายวิชาในหลักสูตร</p>
              <div className="flex flex-wrap gap-1.5">
                {step.subjects.map((subject) => (
                  <span key={subject} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
