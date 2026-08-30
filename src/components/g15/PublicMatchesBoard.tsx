"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Goal } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import { REGION_STYLE, DEFAULT_REGION_STYLE, regionEn } from "@/lib/g15-region";

type Team = { id: number; name: string; logoUrl: string | null; groupName: string | null };

type MatchGoal = { teamId: number; playerName: string; minute: number | null };

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
  goals: MatchGoal[];
};

// รวมผู้ทำประตูของทีมเดียวกันเป็นบรรทัดเดียว เช่น "ชิชา 9', 33' · อัญชฎา 20'"
function scorerSummary(goals: MatchGoal[], teamId: number) {
  const byPlayer = new Map<string, number[]>();
  for (const g of goals) {
    if (g.teamId !== teamId) continue;
    if (!byPlayer.has(g.playerName)) byPlayer.set(g.playerName, []);
    if (g.minute != null) byPlayer.get(g.playerName)!.push(g.minute);
  }
  if (byPlayer.size === 0) return null;
  return Array.from(byPlayer.entries())
    .map(([name, minutes]) => `${name} ${minutes.sort((a, b) => a - b).map((m) => `${m}'`).join(", ")}`)
    .join(" · ");
}

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

function bangkokTimeLabel(date: Date) {
  return date.toLocaleTimeString("en-GB", {
    timeZone: BANGKOK_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function MatchRow({ match }: { match: Match }) {
  const isFinished = match.status === "FINISHED" && match.homeScore != null && match.awayScore != null;
  const homeWon = isFinished && match.homeScore! > match.awayScore!;
  const awayWon = isFinished && match.awayScore! > match.homeScore!;
  const homeScorers = isFinished ? scorerSummary(match.goals, match.homeTeam.id) : null;
  const awayScorers = isFinished ? scorerSummary(match.goals, match.awayTeam.id) : null;

  return (
    <Link
      href={`/g15-womens-series/matches/${match.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-rose-200 hover:shadow-md sm:p-5"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-12 flex-none text-sm font-bold text-slate-900 sm:w-14">
          {match.matchDate ? bangkokTimeLabel(match.matchDate) : "TBD"}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
          <span className={`truncate text-sm sm:text-base ${homeWon ? "font-bold text-slate-900" : "text-slate-600"}`}>
            {match.homeTeam.name}
          </span>
          <TeamBadge team={match.homeTeam} />
        </div>
        <div className="flex flex-none flex-col items-center gap-1">
          {isFinished ? (
            <>
              <span className="text-xl font-extrabold tabular-nums text-slate-900 sm:text-2xl">
                {match.homeScore} - {match.awayScore}
              </span>
              <span className="rounded bg-rose-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                Full time
              </span>
            </>
          ) : (
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-400">VS</span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TeamBadge team={match.awayTeam} />
          <span className={`truncate text-sm sm:text-base ${awayWon ? "font-bold text-slate-900" : "text-slate-600"}`}>
            {match.awayTeam.name}
          </span>
        </div>
      </div>
      {(homeScorers || awayScorers) && (
        <div className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-2.5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex min-w-0 items-start justify-end gap-1 text-right">
            <span className="min-w-0 truncate">{homeScorers}</span>
            {homeScorers && <Goal className="mt-0.5 h-3 w-3 flex-none text-slate-300" />}
          </span>
          <span className="flex min-w-0 items-start gap-1">
            {awayScorers && <Goal className="mt-0.5 h-3 w-3 flex-none text-slate-300" />}
            <span className="min-w-0 truncate">{awayScorers}</span>
          </span>
        </div>
      )}
      {match.venue && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2.5 text-xs text-slate-400">
          <MapPin className="h-3.5 w-3.5 flex-none" />
          {match.venue}
        </div>
      )}
    </Link>
  );
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

  return (
    <div>
      {/* แถบวันที่ — เลือกดูนัดของวันใดวันหนึ่งโดยเฉพาะ แทนตัวกรองกว้างๆ แบบเดิม */}
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
        {dateKeys.map((key) => {
          const sample = datedMatches.find((m) => bangkokDayKey(m.matchDate) === key)!;
          const { weekday, day } = pillDateLabel(sample.matchDate);
          const active = key === selectedDateKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDateKey(key)}
              className={`flex flex-none flex-col items-center gap-0.5 rounded-xl px-4 py-2.5 text-center transition-colors ${
                active
                  ? "bg-rose-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${active ? "text-white/80" : "text-slate-400"}`}>
                {weekday}
              </span>
              <span className="text-sm font-bold">{day}</span>
            </button>
          );
        })}
        {undatedMatches.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedDateKey(TBD_KEY)}
            className={`flex flex-none flex-col items-center justify-center gap-0.5 rounded-xl px-4 py-2.5 text-center transition-colors ${
              selectedDateKey === TBD_KEY
                ? "bg-rose-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="text-sm font-bold">TBD</span>
          </button>
        )}
      </div>

      {/* แถบกรองภาค — เฉพาะเวลามีมากกว่า 1 ภาคให้กรอง ไม่งั้นก็ไม่มีประโยชน์ */}
      {availableRegions.length > 1 && (
        <div className="no-scrollbar mb-5 flex gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedRegion(null)}
            className={`flex-none rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedRegion === null
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            ทั้งหมด
          </button>
          {availableRegions.map((region) => {
            const style = REGION_STYLE[region] ?? DEFAULT_REGION_STYLE;
            const active = selectedRegion === region;
            return (
              <button
                key={region}
                type="button"
                onClick={() => setSelectedRegion(region)}
                className={`flex-none rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-opacity ${style.bg} ${
                  active ? "opacity-100 ring-2 ring-offset-1" : "opacity-40 hover:opacity-70"
                }`}
              >
                {region}
              </button>
            );
          })}
        </div>
      )}

      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <p className="text-sm text-slate-500">ยังไม่มีนัดการแข่งขันในวันนี้</p>
          <p className="mt-0.5 text-xs text-slate-400">No matches on this date</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ round, items }) => {
            const style = REGION_STYLE[round] ?? DEFAULT_REGION_STYLE;
            return (
              <div key={round}>
                <div className="mb-2.5 flex items-center gap-2">
                  <span className={`h-2 w-2 flex-none rounded-full ${style.bg}`} />
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                    {round} <span className="font-normal normal-case text-slate-400">/ {regionEn(round)}</span>
                  </h3>
                  <span className="ml-auto flex-none text-xs text-slate-400">{items.length} นัด / matches</span>
                </div>
                <div className="space-y-3">
                  {items.map((match) => (
                    <MatchRow key={match.id} match={match} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
