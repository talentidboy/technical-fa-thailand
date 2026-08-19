"use client";

import { useState } from "react";
import { ChevronDown, Clock, CalendarDays, BookOpen } from "lucide-react";

export type CoreStep = {
  level: string;
  title: string;
  ageGroup: string;
  description: string;
  totalHours: number;
  theoryHours: number;
  practicalHours: number;
  experienceHours: number;
  days: number;
  subjects: string[];
};

const LEVEL_STYLES: Record<
  string,
  { badge: string; border: string; chip: string; ring: string }
> = {
  G: {
    badge: "bg-slate-600",
    border: "border-t-slate-500",
    chip: "bg-slate-100 text-slate-700",
    ring: "ring-slate-200",
  },
  C: {
    badge: "bg-sky-600",
    border: "border-t-sky-500",
    chip: "bg-sky-50 text-sky-700",
    ring: "ring-sky-200",
  },
  B: {
    badge: "bg-violet-600",
    border: "border-t-violet-500",
    chip: "bg-violet-50 text-violet-700",
    ring: "ring-violet-200",
  },
  A: {
    badge: "bg-orange-600",
    border: "border-t-orange-500",
    chip: "bg-orange-50 text-orange-700",
    ring: "ring-orange-200",
  },
  PRO: {
    badge: "bg-amber-500",
    border: "border-t-amber-400",
    chip: "bg-amber-50 text-amber-700",
    ring: "ring-amber-200",
  },
};

export function CourseStep({
  step,
  index,
}: {
  step: CoreStep;
  index: number;
}) {
  const [open, setOpen] = useState(index === 0);
  const style = LEVEL_STYLES[step.level] ?? LEVEL_STYLES.G;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 border-t-4 bg-white shadow-sm ${style.border}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 p-5 text-left"
      >
        <div className="flex items-start gap-4">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${style.badge}`}
          >
            {step.level}
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              ขั้นที่ {index + 1}
            </p>
            <h3 className="font-bold text-slate-900">{step.title}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{step.ageGroup}</p>
          </div>
        </div>
        <ChevronDown
          className={`mt-2 h-4 w-4 shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div className={`flex flex-wrap items-center gap-3 px-5 pb-4 text-xs ${style.chip} mx-5 mb-4 w-fit rounded-full px-3 py-1.5`}>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {step.totalHours} ชั่วโมง
        </span>
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" />
          {step.days} วัน
        </span>
        <span className="flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" />
          {step.subjects.length} รายวิชา
        </span>
      </div>

      {open && (
        <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 p-5">
          <p className="text-sm leading-relaxed text-slate-600">
            {step.description}
          </p>

          <div className="grid grid-cols-3 gap-3 rounded-xl bg-white p-4 text-center ring-1 ring-slate-100">
            <div>
              <p className="text-lg font-bold text-slate-900">
                {step.theoryHours}
              </p>
              <p className="text-[11px] text-slate-500">ทฤษฎี (ชม.)</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">
                {step.practicalHours}
              </p>
              <p className="text-[11px] text-slate-500">ปฏิบัติ (ชม.)</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">
                {step.experienceHours}
              </p>
              <p className="text-[11px] text-slate-500">
                ประสบการณ์/ดูงาน (ชม.)
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-500">
              รายวิชาในหลักสูตร
            </p>
            <div className="flex flex-wrap gap-1.5">
              {step.subjects.map((subject) => (
                <span
                  key={subject}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${style.chip}`}
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
