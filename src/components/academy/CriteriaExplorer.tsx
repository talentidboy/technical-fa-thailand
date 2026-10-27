"use client";

import { useState } from "react";
import { Check, ListChecks, Table2, Plus, TrendingUp } from "lucide-react";
import { ACADEMY_LEVELS, LEVEL_META, type AcademyLevel } from "@/lib/academy";
import { ACADEMY_CRITERIA, LEVEL_INDEX, LEVEL_SUMMARY, criteriaCount } from "@/lib/academy-criteria";

const COUNTS = Object.fromEntries(ACADEMY_LEVELS.map((l) => [l, criteriaCount(l)])) as Record<AcademyLevel, number>;
// สีเหรียญของแต่ละระดับ (ตรงกับแท่นในหน้าหลัก)
const COIN: Record<AcademyLevel, string> = { BRONZE: "#f47b3c", SILVER: "#a3b0bf", GOLD: "#ffc21a" };
const COLUMN_TONE: Record<AcademyLevel, string> = { BRONZE: "bg-orange-50/70", SILVER: "bg-slate-50", GOLD: "bg-amber-50/70" };

// เกณฑ์มาตรฐานแต่ละระดับ (ฉบับปี 2025) — ดูเป็นรายการของระดับที่เลือกทีละหมวด (บอกข้อที่เพิ่มใหม่/ยกระดับจากระดับก่อนหน้า) หรือเป็นตารางเทียบ 3 ระดับ
export function CriteriaExplorer({ initialLevel = "BRONZE" }: { initialLevel?: AcademyLevel }) {
  const [level, setLevel] = useState<AcademyLevel>(initialLevel);
  const [view, setView] = useState<"list" | "table">("list");
  const [catNo, setCatNo] = useState(ACADEMY_CRITERIA[0].no);
  const i = LEVEL_INDEX[level];
  const s = LEVEL_SUMMARY[level];
  const cat = ACADEMY_CRITERIA.find((c) => c.no === catNo) ?? ACADEMY_CRITERIA[0];
  const catCount = (c: (typeof ACADEMY_CRITERIA)[number]) => c.subs.reduce((n, sub) => n + sub.rows.filter((r) => r[i]).length, 0);
  const keyReqs = [
    ["หัวหน้าอคาเดมี", s.head],
    ["ผู้ฝึกสอน", s.coaches],
    ...(s.assistants ? [["ผู้ช่วยผู้ฝึกสอน", s.assistants]] : []),
    ["ทีม / นักกีฬา", s.teams],
  ];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="ระดับ" className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#e6f3fc] p-1.5">
          {ACADEMY_LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={level === l}
              onClick={() => setLevel(l)}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${level === l ? "bg-[#0b1220] text-white shadow" : "text-slate-600 hover:bg-white"}`}
            >
              <span className="h-3 w-3 flex-none rounded-full ring-2 ring-white/70" style={{ background: COIN[l] }} />
              {LEVEL_META[l].label}
              <span className={`text-xs font-medium ${level === l ? "text-white/60" : "text-slate-400"}`}>{COUNTS[l]} ข้อ</span>
            </button>
          ))}
        </div>
        <div className="flex self-start rounded-xl bg-slate-100 p-1 sm:self-auto">
          {(
            [
              ["list", ListChecks, "รายการ"],
              ["table", Table2, "ตารางเทียบ 3 ระดับ"],
            ] as const
          ).map(([key, Icon, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => setView(key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${view === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "list" ? (
        <div className="mt-5">
          {/* ข้อกำหนดหลักของระดับ — กล่องเหลืองแบบโปสเตอร์ */}
          <dl className={`grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-[#ffd426] p-4 text-[#0b1220] ${keyReqs.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
            {keyReqs.map(([k, v]) => (
              <div key={k} className="flex flex-col-reverse">
                <dt className="text-[11px] font-semibold text-[#0b1220]/65">{k}</dt>
                <dd className="text-sm font-bold">{v}</dd>
              </div>
            ))}
          </dl>

          {/* หมวด: ปุ่มเรียงแถว (เลื่อนแนวนอนได้บนจอแคบ ไม่มีแถบเลื่อนแนวตั้ง) */}
          <div role="tablist" aria-label="หมวด" className="mt-5 flex gap-2 overflow-x-auto overflow-y-hidden pb-1">
            {ACADEMY_CRITERIA.map((c) => (
              <button
                key={c.no}
                type="button"
                role="tab"
                aria-selected={cat.no === c.no}
                onClick={() => setCatNo(c.no)}
                className={`flex flex-none items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                  cat.no === c.no ? "bg-[#1e96dc] text-white" : "bg-[#e6f3fc] text-slate-700 hover:bg-[#d3eafa]"
                }`}
              >
                {c.no}. {c.th}
                <span className={`rounded-md px-1.5 text-[11px] font-bold ${cat.no === c.no ? "bg-white/25" : "bg-white text-slate-500"}`}>{catCount(c)}</span>
              </button>
            ))}
          </div>

          <section key={`${level}-${cat.no}`} className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{cat.en}</p>
            <div className="mt-3 grid gap-x-8 gap-y-6 md:grid-cols-2">
              {cat.subs.map((sub) => {
                const rows = sub.rows.filter((r) => r[i]);
                if (!rows.length) return null;
                return (
                  <div key={sub.code}>
                    <p className="flex items-baseline gap-2 border-b border-slate-100 pb-1.5 text-sm font-bold text-slate-900">
                      <span className="rounded-md bg-[#0b1220] px-1.5 py-0.5 text-[11px] text-white">{sub.code}</span>
                      {sub.th}
                      <span className="text-xs font-normal text-slate-400">{sub.en}</span>
                    </p>
                    <ul className="mt-2.5 space-y-2.5">
                      {rows.map((r, n) => {
                        const cell = r[i]!;
                        const prev = i > 0 ? r[i - 1] : cell;
                        const tag = !prev ? "new" : prev.th !== cell.th ? "up" : null;
                        return (
                          <li key={n} className="flex gap-2.5">
                            <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full text-white" style={{ background: COIN[level] }}>
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                            <span className="min-w-0 text-sm leading-snug text-slate-700">
                              {cell.th}
                              {tag && (
                                <span
                                  className={`ml-1.5 inline-flex items-center gap-0.5 rounded-md px-1.5 py-px align-middle text-[10px] font-bold ${
                                    tag === "new" ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"
                                  }`}
                                >
                                  {tag === "new" ? <Plus className="h-2.5 w-2.5" /> : <TrendingUp className="h-2.5 w-2.5" />}
                                  {tag === "new" ? "เพิ่มใหม่" : "ยกระดับ"}
                                </span>
                              )}
                              <span className="block text-xs text-slate-400">{cell.en}</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead>
              <tr className="bg-[#0b1220] text-white">
                <th className="w-40 px-4 py-3 text-xs font-semibold">หัวข้อ</th>
                {ACADEMY_LEVELS.map((l) => (
                  <th key={l} className="px-4 py-3 text-xs font-semibold">
                    <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: COIN[l] }} />
                    ระดับ{LEVEL_META[l].th} <span className="font-normal text-white/60">· {LEVEL_META[l].label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            {ACADEMY_CRITERIA.map((cat) => (
              <tbody key={cat.no}>
                <tr>
                  <th colSpan={4} className="bg-[#1e96dc] px-4 py-2 text-xs font-bold text-white">
                    {cat.no}. {cat.th} · {cat.en}
                  </th>
                </tr>
                {cat.subs.map((sub) =>
                  sub.rows.map((r, n) => (
                    <tr key={`${sub.code}-${n}`} className="border-t border-slate-100 align-top">
                      {n === 0 && (
                        <th rowSpan={sub.rows.length} className="bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700">
                          {sub.code} {sub.th}
                          <span className="block font-normal text-slate-400">{sub.en}</span>
                        </th>
                      )}
                      {ACADEMY_LEVELS.map((l) => {
                        const cell = r[LEVEL_INDEX[l]];
                        return (
                          <td key={l} className={`px-4 py-2.5 text-xs leading-snug ${COLUMN_TONE[l]}`}>
                            {cell ? (
                              <>
                                <span className="text-slate-700">{cell.th}</span>
                                <span className="block text-slate-400">{cell.en}</span>
                              </>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  )),
                )}
              </tbody>
            ))}
          </table>
        </div>
      )}
    </div>
  );
}
