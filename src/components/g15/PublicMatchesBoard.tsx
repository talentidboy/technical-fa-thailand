"use client";

import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import { REGION_STYLE, DEFAULT_REGION_STYLE, regionEn } from "@/lib/g15-region";

type Team = { id: number; name: string; logoUrl: string | null; groupName: string | null };

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
};

const BANGKOK_TZ = "Asia/Bangkok";
const TBD_KEY = "tbd";

function bangkokDayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BANGKOK_TZ }).format(date);
}

function pillDateLabel(date: Date) {
  return {
    weekday: date.toLocaleDateString("th-TH", { timeZone: BANGKOK_TZ, weekday: "short" }),
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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
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
      {match.venue && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2.5 text-xs text-slate-400">
          <MapPin className="h-3.5 w-3.5 flex-none" />
          {match.venue}
        </div>
      )}
    </div>
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

  const selectedMatches = useMemo(() => {
    if (selectedDateKey === TBD_KEY) return undatedMatches;
    return datedMatches.filter((m) => bangkokDayKey(m.matchDate) === selectedDateKey);
  }, [datedMatches, undatedMatches, selectedDateKey]);

  const grouped = useMemo(() => {
    const byRegion = new Map<string, Match[]>();
    for (const m of selectedMatches) {
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
  }, [selectedMatches, regionOrder]);

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
