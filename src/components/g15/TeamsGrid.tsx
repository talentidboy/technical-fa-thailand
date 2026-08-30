"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, MapPin, ChevronRight, Users, UserCog } from "lucide-react";
import { REGION_STYLE, DEFAULT_REGION_STYLE, regionEn, groupTeamsByRegion } from "@/lib/g15-region";
import { TeamBadge } from "./TeamBadge";

export type TeamWithCounts = {
  id: number;
  name: string;
  logoUrl: string | null;
  groupName: string | null;
  playerCount: number;
  officialCount: number;
};

function TeamCard({ team }: { team: TeamWithCounts }) {
  return (
    <Link
      href={`/g15-womens-series/teams/${team.id}`}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <TeamBadge team={team} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{team.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
          {team.playerCount > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {team.playerCount}
            </span>
          )}
          {team.officialCount > 0 && (
            <span className="flex items-center gap-1">
              <UserCog className="h-3 w-3" />
              {team.officialCount}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 flex-none text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-rose-500" />
    </Link>
  );
}

export function TeamsGrid({ teams }: { teams: TeamWithCounts[] }) {
  const [query, setQuery] = useState("");

  const filteredTeams = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => t.name.toLowerCase().includes(q));
  }, [teams, query]);

  const { regionOrder: activeRegionOrder, byRegion: teamsByRegion, ungrouped: ungroupedTeams } = useMemo(
    () => groupTeamsByRegion(filteredTeams),
    [filteredTeams],
  );

  return (
    <div>
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาชื่อทีม / Search team name..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
        />
      </div>

      {filteredTeams.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-400">
          ไม่พบทีมที่ตรงกับ &quot;{query}&quot;
        </p>
      ) : (
        <div className="space-y-6">
          {activeRegionOrder.map((region) => {
            const style = REGION_STYLE[region] ?? DEFAULT_REGION_STYLE;
            const groupMap = teamsByRegion.get(region)!;
            const letters = Array.from(groupMap.keys()).sort();
            const regionTotal = letters.reduce((s, l) => s + groupMap.get(l)!.length, 0);
            const singleGroup = letters.length === 1;

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
                  <span className="ml-auto text-xs font-medium text-white/80">{regionTotal} ทีม / teams</span>
                </div>
                <div className={`grid grid-cols-1 gap-4 p-5 ${singleGroup ? "" : "sm:grid-cols-2"}`}>
                  {letters.map((letter) => (
                    <div key={letter}>
                      {!singleGroup && (
                        <p className={`mb-2.5 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${style.light} ${style.text}`}>
                          Group / กลุ่ม {letter}
                        </p>
                      )}
                      <div className={singleGroup ? "grid grid-cols-1 gap-2 sm:grid-cols-2" : "space-y-2"}>
                        {groupMap.get(letter)!.map((team) => (
                          <TeamCard key={team.id} team={team} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {ungroupedTeams.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ungroupedTeams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
