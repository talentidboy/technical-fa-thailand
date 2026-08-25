"use client";

import { useMemo, useState } from "react";
import { Search, Calendar, MapPin, Flame } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import { REGION_STYLE, DEFAULT_REGION_STYLE, regionEn } from "@/lib/g15-region";
import { formatMatchDateTime } from "@/lib/g15";

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

function bangkokDayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BANGKOK_TZ }).format(date);
}

// ใช้ en-GB แทน th-TH เพื่อไม่ให้ปีกลายเป็นพุทธศักราช (2569) ซึ่งผู้ใช้ต่างชาติจะงงว่าเป็นปีอะไร
function bangkokDateLabel(date: Date) {
  return date.toLocaleDateString("en-GB", { timeZone: BANGKOK_TZ, day: "numeric", month: "short", year: "numeric" });
}

const TIME_FILTERS = [
  { key: "all", label: "ทั้งหมด", en: "All" },
  { key: "today", label: "วันนี้", en: "Today" },
  { key: "upcoming", label: "นัดถัดไป", en: "Upcoming" },
  { key: "finished", label: "ผลจบแล้ว", en: "Results" },
] as const;

type FilterKey = (typeof TIME_FILTERS)[number]["key"];

function MatchCard({ match }: { match: Match }) {
  const isFinished = match.status === "FINISHED" && match.homeScore != null && match.awayScore != null;
  const homeWon = isFinished && match.homeScore! > match.awayScore!;
  const awayWon = isFinished && match.awayScore! > match.homeScore!;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-slate-300 hover:bg-slate-50">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
          <span className={`truncate text-sm ${homeWon ? "font-bold text-slate-900" : "text-slate-500"}`}>
            {match.homeTeam.name}
          </span>
          <TeamBadge team={match.homeTeam} />
        </div>
        {isFinished ? (
          <span className="relative flex-none rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-bold tabular-nums text-white">
            {match.homeScore} - {match.awayScore}
            {Math.abs(match.homeScore! - match.awayScore!) >= 10 && (
              <Flame className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 fill-amber-400 text-amber-500" />
            )}
          </span>
        ) : (
          <span className="flex-none rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-400">VS</span>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TeamBadge team={match.awayTeam} />
          <span className={`truncate text-sm ${awayWon ? "font-bold text-slate-900" : "text-slate-500"}`}>
            {match.awayTeam.name}
          </span>
        </div>
      </div>
      {(match.matchDate || match.venue) && (
        <div className="mt-2.5 flex items-center justify-center gap-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
          {match.matchDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatMatchDateTime(match.matchDate)}
            </span>
          )}
          {match.venue && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {match.venue}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function PublicMatchesBoard({ matches, regionOrder }: { matches: Match[]; regionOrder: string[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [now] = useState(() => new Date());
  const todayKey = useMemo(() => bangkokDayKey(now), [now]);

  const buckets = useMemo(() => {
    const today: Match[] = [];
    const upcoming: Match[] = [];
    const finished: Match[] = [];
    for (const m of matches) {
      if (m.status === "FINISHED") finished.push(m);
      if (m.matchDate) {
        const key = bangkokDayKey(m.matchDate);
        if (key === todayKey) today.push(m);
        else if (m.matchDate.getTime() > now.getTime()) upcoming.push(m);
      }
    }
    return { today, upcoming, finished };
  }, [matches, now, todayKey]);

  const counts: Record<FilterKey, number> = {
    all: matches.length,
    today: buckets.today.length,
    upcoming: buckets.upcoming.length,
    finished: buckets.finished.length,
  };

  const timeFiltered =
    filter === "all"
      ? matches
      : filter === "today"
        ? buckets.today
        : filter === "upcoming"
          ? buckets.upcoming
          : buckets.finished;

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return timeFiltered;
    return timeFiltered.filter(
      (m) => m.homeTeam.name.toLowerCase().includes(q) || m.awayTeam.name.toLowerCase().includes(q),
    );
  }, [timeFiltered, search]);

  const grouped = useMemo(() => {
    const byRegion = new Map<string, Match[]>();
    for (const m of searched) {
      if (!byRegion.has(m.round)) byRegion.set(m.round, []);
      byRegion.get(m.round)!.push(m);
    }
    const order = [
      ...regionOrder.filter((r) => byRegion.has(r)),
      ...Array.from(byRegion.keys()).filter((r) => !regionOrder.includes(r)),
    ];
    return order.map((region) => {
      const regionMatches = byRegion.get(region)!;
      const byDate = new Map<string, Match[]>();
      for (const m of regionMatches) {
        const key = m.matchDate ? bangkokDateLabel(m.matchDate) : "ยังไม่กำหนดวันแข่ง";
        if (!byDate.has(key)) byDate.set(key, []);
        byDate.get(key)!.push(m);
      }
      // วันที่ผ่านมาล่าสุดขึ้นก่อน — นัดที่ยังไม่กำหนดวันแข่งไปอยู่ท้ายสุด
      const dateGroups = Array.from(byDate.entries()).sort(([, aMatches], [, bMatches]) => {
        const aTime = aMatches[0].matchDate?.getTime() ?? -Infinity;
        const bTime = bMatches[0].matchDate?.getTime() ?? -Infinity;
        return bTime - aTime;
      });
      return { region, total: regionMatches.length, dateGroups };
    });
  }, [searched, regionOrder]);

  const emptyMessage =
    filter === "today"
      ? { th: "วันนี้ไม่มีนัดการแข่งขัน", en: "No matches today" }
      : filter === "upcoming"
        ? { th: "ยังไม่มีนัดการแข่งขันที่กำลังจะถึง", en: "No upcoming matches yet" }
        : search
          ? { th: "ไม่พบทีมที่ค้นหา", en: "No matching team found" }
          : { th: "ยังไม่มีนัดการแข่งขัน", en: "No matches yet" };

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TIME_FILTERS.map(({ key, label, en }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                filter === key
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label} <span className="opacity-70">/ {en}</span> ({counts[key]})
            </button>
          ))}
        </div>
        <div className="relative sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาทีม / Search team"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <p className="text-sm text-slate-500">{emptyMessage.th}</p>
          <p className="mt-0.5 text-xs text-slate-400">{emptyMessage.en}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ region, total, dateGroups }) => {
            const style = REGION_STYLE[region] ?? DEFAULT_REGION_STYLE;
            return (
              <div
                key={region}
                className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ${style.ring}`}
              >
                <div className={`flex items-center gap-2.5 px-5 py-3 ${style.bg}`}>
                  <MapPin className="h-4 w-4 text-white" />
                  <h3 className="font-bold text-white">
                    {region} <span className="font-normal text-white/70">/ {regionEn(region)}</span>
                  </h3>
                  <span className="ml-auto text-xs font-medium text-white/80">{total} นัด / matches</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {dateGroups.map(([date, dateMatches]) => (
                    <div key={date} className="p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{date}</p>
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        {dateMatches.map((match) => (
                          <MatchCard key={match.id} match={match} />
                        ))}
                      </div>
                    </div>
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
