"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Clock, GraduationCap, Users } from "lucide-react";
import type { CoreStep } from "@/lib/coach-program";
import { display, levelTone } from "@/components/coach/CoachUi";

// ความสูงขั้นบันได (G ต่ำสุด → PRO สูงสุด)
const STEP_H = ["h-16", "h-24", "h-32", "h-40", "h-48"];

// AFC Core Program: บันได 5 ขั้นให้เลือกระดับ + แผงรายละเอียดของระดับที่เลือก + ตารางเปรียบเทียบ
// ลิงก์ /courses#level-B จากหน้าอื่นเปิดระดับนั้นให้เลย
export function CoreProgramExplorer({ steps }: { steps: CoreStep[] }) {
  const [sel, setSel] = useState(0);
  const stairs = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fromHash = () => {
      const i = steps.findIndex((s) => `#level-${s.level}` === window.location.hash);
      if (i < 0) return;
      setSel(i);
      stairs.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const t = window.setTimeout(fromHash, 0);
    window.addEventListener("hashchange", fromHash);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("hashchange", fromHash);
    };
  }, [steps]);

  const step = steps[sel];
  const tone = levelTone(step.level);
  const parts = [
    { label: "ทฤษฎี", hours: step.theoryHours, cls: "bg-[#073c5e]" },
    { label: "ปฏิบัติ", hours: step.practicalHours, cls: "bg-sky-400" },
    { label: "ประสบการณ์ / ดูงาน", hours: step.experienceHours, cls: "bg-amber-400" },
  ];
  const total = parts.reduce((s, p) => s + p.hours, 0) || 1;
  const go = (i: number) => setSel(Math.max(0, Math.min(steps.length - 1, i)));

  return (
    <div className="space-y-6">
      {/* บันได: เลือกระดับ */}
      <div ref={stairs} role="tablist" aria-label="เลือกระดับ" className="scroll-mt-28 grid grid-cols-5 items-end gap-1.5 border-b-4 border-[#073c5e] sm:gap-3">
        {steps.map((s, i) => {
          const t = levelTone(s.level);
          const on = i === sel;
          return (
            <button
              key={s.level}
              id={`level-${s.level}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls="core-panel"
              onClick={() => setSel(i)}
              className="group flex scroll-mt-24 flex-col items-stretch text-left outline-none focus-visible:[&>span:last-child]:ring-4 focus-visible:[&>span:last-child]:ring-[#e3bb63]"
            >
              <span className={`mb-1.5 text-center text-[11px] font-semibold sm:text-xs ${on ? t.text : "text-slate-400 group-hover:text-slate-600"}`}>
                {s.totalHours} ชม.
              </span>
              <span
                className={`relative flex ${STEP_H[i] ?? "h-48"} flex-col justify-end rounded-t-lg p-1.5 transition-all sm:p-3 ${
                  on ? `${t.bar} text-white shadow-[0_-6px_0_rgb(0_0_0/0.12)_inset]` : "text-slate-500 group-hover:brightness-95"
                }`}
                style={on ? undefined : { background: `${t.hex}1f`, borderTop: `4px solid ${t.hex}` }}
              >
                <span className={`${display.className} text-xl font-semibold leading-none sm:text-4xl`} style={on ? undefined : { color: t.hex }}>
                  {s.level}
                </span>
                <span className={`mt-1 hidden text-xs sm:block ${on ? "text-white/80" : "text-slate-500"}`}>ขั้นที่ {i + 1}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* รายละเอียดของระดับที่เลือก */}
      <div id="core-panel" role="tabpanel" aria-labelledby={`level-${step.level}`} className="scroll-mt-24 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
        <div className="h-1.5" style={{ background: tone.hex }} />
        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="min-w-0">
            <p className={`text-xs font-semibold ${tone.text}`}>
              ขั้นที่ {sel + 1} จาก {steps.length}
            </p>
            <h3 className={`${display.className} mt-1 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl`}>{step.title}</h3>
            <p className={`mt-3 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-semibold ${tone.soft}`}>
              <Users className="h-4 w-4 flex-none" />
              {step.ageGroup}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{step.description}</p>

            <dl className="mt-6 grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-200 py-4">
              {[
                { icon: Clock, v: step.totalHours, l: "ชั่วโมงเรียน" },
                { icon: CalendarDays, v: step.days, l: "วัน" },
                { icon: BookOpen, v: step.subjects.length, l: "รายวิชา" },
              ].map(({ icon: Icon, v, l }) => (
                <div key={l} className="flex flex-col-reverse px-3 first:pl-0 sm:px-5">
                  <dt className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <Icon className="h-3.5 w-3.5" />
                    {l}
                  </dt>
                  <dd className={`${display.className} text-3xl font-semibold text-slate-900`}>{v}</dd>
                </div>
              ))}
            </dl>

            {/* สัดส่วนชั่วโมงเรียน */}
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold text-slate-500">สัดส่วนชั่วโมงเรียน</p>
              <div className="flex h-3 overflow-hidden rounded-full bg-slate-200">
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
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">รายวิชาในหลักสูตร ({step.subjects.length})</p>
            <ol className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {step.subjects.map((subject, i) => (
                <li key={subject} className="flex items-center gap-3 rounded-lg bg-[#f6f4ef] px-3 py-2.5 text-sm font-medium text-slate-800">
                  <span className={`${display.className} flex h-7 w-7 flex-none items-center justify-center rounded-md text-xs font-semibold text-white`} style={{ background: tone.hex }}>
                    {i + 1}
                  </span>
                  {subject}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ไปขั้นก่อน / ถัดไป + สมัคร */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-[#f6f4ef]/60 px-5 py-4 sm:px-8">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => go(sel - 1)}
              disabled={sel === 0}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              {sel > 0 ? steps[sel - 1].level : "ก่อนหน้า"}
            </button>
            <button
              type="button"
              onClick={() => go(sel + 1)}
              disabled={sel === steps.length - 1}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              {sel < steps.length - 1 ? `ขั้นถัดไป ${steps[sel + 1].level}` : "ขั้นสูงสุด"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <Link href="/coach-center#open" className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#e3bb63] px-4 text-sm font-semibold text-[#031a2c] hover:bg-[#ecc97b]">
            <GraduationCap className="h-4 w-4" />
            ดูรุ่นที่เปิดรับสมัคร
          </Link>
        </div>
      </div>

      {/* เปรียบเทียบทุกระดับ */}
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
        <p className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">เปรียบเทียบทุกระดับ</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="px-5 py-2 font-medium">ระดับ</th>
                <th className="px-3 py-2 font-medium">กลุ่มเป้าหมาย</th>
                <th className="px-3 py-2 text-right font-medium">ชั่วโมง</th>
                <th className="px-3 py-2 text-right font-medium">วัน</th>
                <th className="px-5 py-2 text-right font-medium">รายวิชา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {steps.map((s, i) => {
                const t = levelTone(s.level);
                return (
                  <tr key={s.level} onClick={() => setSel(i)} className={`cursor-pointer ${i === sel ? "bg-[#f6f4ef]" : "hover:bg-slate-50"}`}>
                    <td className="px-5 py-2.5">
                      <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
                        <span className={`${display.className} flex h-6 min-w-8 items-center justify-center rounded px-1 text-xs text-white ${t.bar}`}>{s.level}</span>
                        {s.title}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{s.ageGroup}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-900">{s.totalHours}</td>
                    <td className="px-3 py-2.5 text-right text-slate-700">{s.days}</td>
                    <td className="px-5 py-2.5 text-right text-slate-700">{s.subjects.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
