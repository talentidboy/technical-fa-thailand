import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseRegionGroup, regionEn } from "@/lib/g15-region";
import { parseStage, NATIONAL_GROUPS, groupRound, roundStyle, roundEn } from "@/lib/g15-stage";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { StageSwitcher } from "@/components/g15/StageSwitcher";
import { TeamsGrid, TeamCard, type TeamWithCounts } from "@/components/g15/TeamsGrid";
import { Reveal } from "@/components/g15/Reveal";
import { Users, Trophy } from "lucide-react";

export default async function G15TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const stage = parseStage((await searchParams).stage);

  const [user, teams, players, officials] = await Promise.all([
    getCurrentUser(),
    prisma.g15Team.findMany({ orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    // แค่ตัวนับต่อทีมสำหรับหน้ารวม — รายละเอียดเต็มไปอยู่หน้าโปรไฟล์ทีมแทน
    prisma.g15Player.groupBy({ by: ["teamId"], _count: { id: true } }),
    prisma.g15Official.groupBy({ by: ["teamId"], _count: { id: true } }),
  ]);

  const playerCountByTeam = new Map(players.map((p) => [p.teamId, p._count.id]));
  const officialCountByTeam = new Map(officials.map((o) => [o.teamId, o._count.id]));

  const withCounts = (t: (typeof teams)[number]): TeamWithCounts => ({
    id: t.id,
    name: t.name,
    logoUrl: t.logoUrl,
    groupName: t.groupName,
    playerCount: playerCountByTeam.get(t.id) ?? 0,
    officialCount: officialCountByTeam.get(t.id) ?? 0,
  });

  const nationalTeams = teams
    .filter((t) => t.nationalGroup)
    .sort((a, b) => (a.nationalGroup ?? "").localeCompare(b.nationalGroup ?? "") || (a.nationalSeed ?? 99) - (b.nationalSeed ?? 99));
  const shownTeams = stage === "NATIONAL" ? nationalTeams : teams;

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Chrome user={user} stage={stage} />

      {/* ฮีโร่ไล่สีชุดเดียวกับหน้าอื่นๆ ของ G15 — เนื้อหาหลักลอยทับขอบล่างให้ภาษาภาพเป็นชุดเดียวกันทั้งเว็บ */}
      <section className="relative overflow-hidden bg-linear-to-br from-rose-950 via-rose-900 to-fuchsia-800 pb-20 pt-8 sm:pb-24">
        <div className="absolute inset-x-0 top-0 h-1.5 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-rose-200">
            <Users className="h-3.5 w-3.5" />
            Teams
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
            ทีมที่เข้าร่วม <span className="text-base font-normal text-rose-200">/ Teams</span>
          </h1>
          <StageSwitcher stage={stage} basePath="/g15-womens-series/teams" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-20">
        {shownTeams.length === 0 ? (
          <div className="relative z-10 -mt-10 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-xl shadow-rose-950/10 sm:-mt-14">
            <Users className="h-8 w-8 text-slate-400" />
            <p className="text-sm text-slate-500">ยังไม่มีทีมเข้าร่วม</p>
            <p className="text-xs text-slate-400">No teams yet</p>
          </div>
        ) : stage === "NATIONAL" ? (
          <Reveal>
            <div className="relative z-10 -mt-10 grid grid-cols-1 gap-6 sm:-mt-14 lg:grid-cols-2">
              {NATIONAL_GROUPS.map((group) => {
                const round = groupRound(group);
                const style = roundStyle(round);
                const groupTeams = nationalTeams.filter((t) => t.nationalGroup === group);
                if (groupTeams.length === 0) return null;
                return (
                  <div
                    key={group}
                    className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ${style.ring}`}
                  >
                    <div className={`flex items-center gap-2.5 px-5 py-3 ${style.bg}`}>
                      <Trophy className="h-4 w-4 text-white" />
                      <h3 className="font-bold text-white">
                        {round} <span className="font-normal text-white/70">/ {roundEn(round)}</span>
                      </h3>
                      <span className="ml-auto text-xs font-medium text-white/80">{groupTeams.length} ทีม / teams</span>
                    </div>
                    <div className="space-y-2 p-5">
                      {groupTeams.map((t) => {
                        const region = parseRegionGroup(t.groupName)?.region ?? null;
                        return (
                          <TeamCard
                            key={t.id}
                            team={withCounts(t)}
                            slot={`${group}${t.nationalSeed ?? ""}`}
                            subtitle={region ? `ตัวแทน${region} / ${regionEn(region)}` : undefined}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        ) : (
          <Reveal>
            <div className="relative z-10 -mt-10 sm:-mt-14">
              <TeamsGrid teams={teams.map(withCounts)} />
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
