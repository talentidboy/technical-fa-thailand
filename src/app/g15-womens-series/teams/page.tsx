import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { REGION_STYLE, DEFAULT_REGION_STYLE, regionEn, groupTeamsByRegion } from "@/lib/g15-region";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { MapPin, ChevronRight, Users } from "lucide-react";

export default async function G15TeamsPage() {
  const [user, teams, players, officials] = await Promise.all([
    getCurrentUser(),
    prisma.g15Team.findMany({ orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    // แค่ตัวนับต่อทีมสำหรับหน้ารวม — รายละเอียดเต็มไปอยู่หน้าโปรไฟล์ทีมแทน
    prisma.g15Player.groupBy({ by: ["teamId"], _count: { id: true } }),
    prisma.g15Official.groupBy({ by: ["teamId"], _count: { id: true } }),
  ]);

  const playerCountByTeam = new Map(players.map((p) => [p.teamId, p._count.id]));
  const officialCountByTeam = new Map(officials.map((o) => [o.teamId, o._count.id]));

  const { regionOrder, byRegion: teamsByRegion, ungrouped: ungroupedTeams } = groupTeamsByRegion(teams);

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Chrome user={user} />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">ทีมที่เข้าร่วม</h1>
          <p className="text-sm text-slate-400">Teams</p>
        </div>

        {teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Users className="h-8 w-8 text-slate-400" />
            <p className="text-sm text-slate-500">ยังไม่มีทีมเข้าร่วม</p>
            <p className="text-xs text-slate-400">No teams yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {regionOrder.map((region) => {
              const style = REGION_STYLE[region] ?? DEFAULT_REGION_STYLE;
              const groupMap = teamsByRegion.get(region)!;
              const letters = Array.from(groupMap.keys()).sort();
              const regionTotal = letters.reduce((s, l) => s + groupMap.get(l)!.length, 0);

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
                  <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
                    {letters.map((letter) => (
                      <div key={letter}>
                        <p className={`mb-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${style.light} ${style.text}`}>
                          Group / กลุ่ม {letter}
                        </p>
                        <ul className="space-y-1">
                          {groupMap.get(letter)!.map((team) => {
                            const playerCount = playerCountByTeam.get(team.id) ?? 0;
                            const officialCount = officialCountByTeam.get(team.id) ?? 0;
                            const hasRoster = playerCount > 0 || officialCount > 0;

                            const badge = team.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={team.logoUrl} alt="" className="h-6 w-6 flex-none rounded-full object-cover" />
                            ) : (
                              <span
                                className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[10px] font-bold text-white ${style.bg}`}
                              >
                                {team.name.charAt(0)}
                              </span>
                            );

                            return (
                              <li key={team.id}>
                                <Link
                                  href={`/g15-womens-series/teams/${team.id}`}
                                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  {badge}
                                  <span className="min-w-0 flex-1 truncate">{team.name}</span>
                                  {hasRoster && (
                                    <span className="flex-none text-[10px] text-slate-400">
                                      {playerCount > 0 && `${playerCount} players`}
                                      {playerCount > 0 && officialCount > 0 && " · "}
                                      {officialCount > 0 && `${officialCount} staff`}
                                    </span>
                                  )}
                                  <ChevronRight className="h-3.5 w-3.5 flex-none text-slate-400" />
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {ungroupedTeams.length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {ungroupedTeams.map((team) => (
                  <div
                    key={team.id}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"
                  >
                    {team.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={team.logoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-600">
                        {team.name.charAt(0)}
                      </div>
                    )}
                    <p className="text-sm font-medium text-slate-900">{team.name}</p>
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
