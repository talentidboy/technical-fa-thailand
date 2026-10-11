"use client";

import { useMemo, useState } from "react";
import { Bebas_Neue } from "next/font/google";
import { CheckCircle2 } from "lucide-react";
import { roundStyle, roundEn, isLive } from "@/lib/g15-stage";
import { MatchCard, type MatchCardData } from "./MatchCard";

const display = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });

type Team = { id: number; name: string; logoUrl: string | null; groupName: string | null };

type MatchGoal = { teamId: number; playerName: string; minute: number | null; addedMinute?: number | null; isOwnGoal?: boolean };

type Match = {
  id: number;
  round: string;
  matchDate: Date | null;
  venue: string | null;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  matchNo?: number | null;
  homePenalty?: number | null;
  awayPenalty?: number | null;
  goals: MatchGoal[];
  clockPhase?: string;
  firstHalfStartedAt?: Date | null;
  secondHalfStartedAt?: Date | null;
  firstHalfAddedTime?: number | null;
  secondHalfAddedTime?: number | null;
};

const BANGKOK_TZ = "Asia/Bangkok";
const TBD_KEY = "tbd";

function bangkokDayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BANGKOK_TZ }).format(date);
}

// ชื่อวันแบบย่อภาษาไทย ("ส." ฯลฯ) ต่อให้เขียนจาก en-US weekday name ก่อนเสมอ ไม่ใช้ th-TH weekday:"short" ตรงๆ
// เพราะ ICU ฝั่ง Node (SSR) กับฝั่งเบราว์เซอร์ย่อวันภาษาไทยไม่เหมือนกัน ("เสาร์" vs "ส.") ทำให้ hydration mismatch
const THAI_WEEKDAY_SHORT: Record<string, string> = {
  Sun: "อา.",
  Mon: "จ.",
  Tue: "อ.",
  Wed: "พ.",
  Thu: "พฤ.",
  Fri: "ศ.",
  Sat: "ส.",
};

function pillDateLabel(date: Date) {
  const enWeekday = date.toLocaleDateString("en-US", { timeZone: BANGKOK_TZ, weekday: "short" });
  return {
    weekday: THAI_WEEKDAY_SHORT[enWeekday] ?? enWeekday,
    day: date.toLocaleDateString("en-GB", { timeZone: BANGKOK_TZ, day: "numeric", month: "short" }),
  };
}

export function PublicMatchesBoard({ matches, regionOrder }: { matches: Match[]; regionOrder: string[] }) {
  const datedMatches = useMemo(
    () => matches.filter((m): m is Match & { matchDate: Date } => m.matchDate != null),
    [matches],
  );
  const undatedMatches = useMemo(() => matches.filter((m) => m.matchDate == null), [matches]);

  const dateKeys = useMemo(() => {
    const keys = new Set(datedMatches.map((m) => bangkokDayKey(m.matchDate)));
    return Array.from(keys).sort();
  }, [datedMatches]);

  const [now] = useState(() => new Date());
  const todayKey = useMemo(() => bangkokDayKey(now), [now]);

  // เลือกวันที่ใกล้ "ตอนนี้" ที่สุดเป็นค่าเริ่มต้น — วันนี้ถ้ามีนัด ไม่งั้นนัดถัดไปที่ใกล้สุด ไม่งั้นนัดล่าสุดที่ผ่านมา
  const defaultDateKey = useMemo(() => {
    if (dateKeys.includes(todayKey)) return todayKey;
    const nextUpcoming = dateKeys.find((k) => k > todayKey);
    if (nextUpcoming) return nextUpcoming;
    return dateKeys[dateKeys.length - 1] ?? (undatedMatches.length > 0 ? TBD_KEY : null);
  }, [dateKeys, todayKey, undatedMatches.length]);

  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(defaultDateKey);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const selectedMatches = useMemo(() => {
    if (selectedDateKey === TBD_KEY) return undatedMatches;
    return datedMatches.filter((m) => bangkokDayKey(m.matchDate) === selectedDateKey);
  }, [datedMatches, undatedMatches, selectedDateKey]);

  // ภาคที่มีนัดจริงในระบบ (ไม่ใช่ regionOrder ทั้งหมดเสมอไป) — ใช้ทำแถบตัวกรอง
  const availableRegions = useMemo(() => {
    const present = new Set(matches.map((m) => m.round));
    return [...regionOrder.filter((r) => present.has(r)), ...Array.from(present).filter((r) => !regionOrder.includes(r))];
  }, [matches, regionOrder]);

  const grouped = useMemo(() => {
    const byRegion = new Map<string, Match[]>();
    for (const m of selectedMatches) {
      if (selectedRegion && m.round !== selectedRegion) continue;
      if (!byRegion.has(m.round)) byRegion.set(m.round, []);
      byRegion.get(m.round)!.push(m);
    }
    const order = [
      ...regionOrder.filter((r) => byRegion.has(r)),
      ...Array.from(byRegion.keys()).filter((r) => !regionOrder.includes(r)),
    ];
    return order.map((round) => ({
      round,
      items: [...byRegion.get(round)!].sort((a, b) => (a.matchDate?.getTime() ?? 0) - (b.matchDate?.getTime() ?? 0)),
    }));
  }, [selectedMatches, regionOrder, selectedRegion]);

  // สรุปของแต่ละวัน (สำหรับแถบเลือกวัน): เลขนัด · จำนวนนัด · จบครบแล้ว/กำลังแข่ง
  const daySummary = (key: string) => {
    const list = key === TBD_KEY ? undatedMatches : datedMatches.filter((m) => bangkokDayKey(m.matchDate) === key);
    const matchNos = [...new Set(list.map((m) => m.matchNo).filter((n): n is number => n != null))];
    return {
      count: list.length,
      matchday: matchNos.length === 1 ? matchNos[0] : null,
      done: list.length > 0 && list.every((m) => m.status === "FINISHED"),
      live: list.some((m) => isLive(m, now)),
    };
  };

  const dayTab = (key: string, top: string, main: string) => {
    const active = key === selectedDateKey;
    const sum = daySummary(key);
    return (
      <button
        key={key}
        type="button"
        onClick={() => setSelectedDateKey(key)}
        className={`relative flex min-w-24 flex-none flex-col items-center rounded-2xl px-4 py-2.5 text-center transition-all ${
          active
            ? "bg-linear-to-br from-g15-700 to-g15-500 text-white shadow-lg shadow-g15-600/30"
            : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-g15-300"
        }`}
      >
        {sum.live && <span className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-red-500" />}
        <span className={`text-[10px] font-bold uppercase tracking-wide ${active ? "text-amber-300" : "text-g15-500"}`}>
          {sum.matchday != null ? `นัดที่ ${sum.matchday}` : top}
        </span>
        <span className={`${display.className} text-2xl leading-tight`}>{main}</span>
        <span className={`flex items-center gap-1 text-[10px] font-medium ${active ? "text-white/75" : "text-slate-400"}`}>
          {sum.done && <CheckCircle2 className={`h-3 w-3 ${active ? "text-emerald-300" : "text-emerald-500"}`} />}
          {sum.matchday != null ? `${top} · ` : ""}
          {sum.count} นัด
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* แถบเลือกวัน (การ์ดลอยทับขอบล่างของฮีโร่) */}
      <div className="rounded-3xl bg-white p-2.5 shadow-xl shadow-g15-950/10 ring-1 ring-slate-200 sm:p-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {dateKeys.map((key) => {
            const sample = datedMatches.find((m) => bangkokDayKey(m.matchDate) === key)!;
            const { weekday, day } = pillDateLabel(sample.matchDate);
            return dayTab(key, weekday, day);
          })}
          {undatedMatches.length > 0 && dayTab(TBD_KEY, "ยังไม่กำหนด", "TBD")}
        </div>

        {/* กรองกลุ่ม/ภาค — เฉพาะเวลามีมากกว่า 1 ให้เลือก */}
        {availableRegions.length > 1 && (
          <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto border-t border-slate-100 pt-2.5">
            <button
              type="button"
              onClick={() => setSelectedRegion(null)}
              className={`flex-none rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                selectedRegion === null ? "bg-g15-950 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              ทั้งหมด
            </button>
            {availableRegions.map((region) => {
              const style = roundStyle(region);
              const active = selectedRegion === region;
              return (
                <button
                  key={region}
                  type="button"
                  onClick={() => setSelectedRegion(active ? null : region)}
                  className={`flex-none rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    active ? `${style.bg} text-white shadow-sm` : `${style.light} ${style.text} hover:opacity-80`
                  }`}
                >
                  {region}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-sm text-slate-500">ยังไม่มีนัดการแข่งขันในวันนี้</p>
          <p className="mt-0.5 text-xs text-slate-400">No matches on this date</p>
        </div>
      ) : (
        grouped.map(({ round, items }) => {
          const style = roundStyle(round);
          return (
            <section key={round}>
              <div className="mb-3 flex items-center gap-3">
                <span className={`h-7 w-1.5 flex-none rounded-full ${style.bg}`} />
                <h3 className={`${display.className} text-3xl uppercase leading-none text-g15-950`}>{roundEn(round) || round}</h3>
                {roundEn(round) && <span className="text-sm font-semibold text-slate-400">/ {round}</span>}
                <span className="ml-auto flex-none rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
                  {items.length} นัด
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {items.map((match) => (
                  <MatchCard key={match.id} match={match as MatchCardData} now={now} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
