import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStandings, getRecentForm } from "@/lib/g15";
import { REGION_STYLE, DEFAULT_REGION_STYLE, regionEn, groupStandingsByRegion } from "@/lib/g15-region";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { StandingTable } from "@/components/g15/StandingTable";
import { Reveal } from "@/components/g15/Reveal";
import { MapPin, Trophy } from "lucide-react";

export default async function G15StandingsPage() {
  const [user, teams, matches] = await Promise.all([
    getCurrentUser(),
    prisma.g15Team.findMany({ orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    prisma.g15Match.findMany(),
  ]);

  const standingGroups = getStandings(teams, matches);
  const { regionOrder, byRegion, ungrouped } = groupStandingsByRegion(standingGroups);
  const formByTeamId = new Map(teams.map((t) => [t.id, getRecentForm(t.id, matches)]));

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Chrome user={user} />

      {/* ฮีโร่ไล่สีชุดเดียวกับหน้าอื่นๆ ของ G15 — เนื้อหาหลักลอยทับขอบล่างให้ภาษาภาพเป็นชุดเดียวกันทั้งเว็บ */}
      <section className="relative overflow-hidden bg-linear-to-br from-rose-950 via-rose-900 to-fuchsia-800 pb-20 pt-8 sm:pb-24">
        <div className="absolute inset-x-0 top-0 h-1.5 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-rose-200">
            <Trophy className="h-3.5 w-3.5" />
            Standings
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
            ตารางคะแนน <span className="text-base font-normal text-rose-200">/ Standings</span>
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-20">
        {regionOrder.length === 0 && ungrouped.length === 0 ? (
          <div className="relative z-10 -mt-10 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-xl shadow-rose-950/10 sm:-mt-14">
            <Trophy className="h-8 w-8 text-slate-400" />
            <p className="text-sm text-slate-500">ยังไม่มีตารางคะแนน</p>
            <p className="text-xs text-slate-400">No standings yet</p>
          </div>
        ) : (
          <div className="relative z-10 -mt-10 space-y-6 sm:-mt-14">
            <Reveal>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {regionOrder.map((region) => {
                const style = REGION_STYLE[region] ?? DEFAULT_REGION_STYLE;
                const groupMap = byRegion.get(region)!;
                const letters = Array.from(groupMap.keys()).sort();

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
                    </div>
                    <div className="divide-y divide-slate-100">
                      {letters.map((letter) => (
                        <div key={letter}>
                          {/* ไม่โชว์ป้ายกลุ่มถ้าภาคนั้นมีกลุ่มเดียว (ไม่ได้แบ่ง A/B) — ป้าย "กลุ่ม A" เดี่ยวๆ ไม่มีประโยชน์ */}
                          {letters.length > 1 && (
                            <p className={`px-5 pt-3 text-xs font-bold ${style.text}`}>กลุ่ม {letter}</p>
                          )}
                          <StandingTable group={groupMap.get(letter)!} formByTeamId={formByTeamId} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            </Reveal>

            {ungrouped.length > 0 && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {ungrouped.map((group) => (
                  <div
                    key={group.groupName}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="border-b border-slate-100 px-5 py-3">
                      <h3 className="font-semibold text-slate-900">{group.groupName}</h3>
                    </div>
                    <StandingTable group={group} formByTeamId={formByTeamId} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
