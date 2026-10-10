import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStandings, getRecentForm, getNationalStandings, getNationalBracket } from "@/lib/g15";
import { REGION_STYLE, DEFAULT_REGION_STYLE, regionEn, groupStandingsByRegion } from "@/lib/g15-region";
import { parseStage, isGroupRound, hasLiveScore, projectLive, needsLiveSync } from "@/lib/g15-stage";
import { LiveSync } from "@/components/g15/LiveSync";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { HeroArt } from "@/components/g15/HeroArt";
import { StandingTable } from "@/components/g15/StandingTable";
import { StageSwitcher } from "@/components/g15/StageSwitcher";
import { NationalGroupTables } from "@/components/g15/NationalGroupTables";
import { KnockoutBracket } from "@/components/g15/KnockoutBracket";
import { Reveal } from "@/components/g15/Reveal";
import { MapPin, Trophy, GitBranch } from "lucide-react";

export default async function G15StandingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const stage = parseStage((await searchParams).stage);

  const [user, teams, matches] = await Promise.all([
    getCurrentUser(),
    prisma.g15Team.findMany({ orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    prisma.g15Match.findMany({ where: { stage } }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Chrome user={user} stage={stage} />
      <LiveSync active={matches.some((m) => needsLiveSync(m))} stage={stage} />

      {/* ฮีโร่ไล่สีชุดเดียวกับหน้าอื่นๆ ของ G15 — เนื้อหาหลักลอยทับขอบล่างให้ภาษาภาพเป็นชุดเดียวกันทั้งเว็บ */}
      <section className="relative isolate overflow-hidden bg-linear-to-br from-g15-950 via-g15-800 to-g15-600 pb-20 pt-8 sm:pb-24">
        <div className="absolute inset-x-0 top-0 h-1.5 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
        <HeroArt />
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-g15-200">
            <Trophy className="h-3.5 w-3.5" />
            Standings
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
            ตารางคะแนน <span className="text-base font-normal text-g15-200">/ Standings</span>
          </h1>
          <StageSwitcher stage={stage} basePath="/g15-womens-series/standings" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-20">
        {stage === "NATIONAL" ? (
          <NationalStandings teams={teams} matches={matches} />
        ) : (
          <RegionalStandings teams={teams} matches={matches} />
        )}
      </div>
    </div>
  );
}

type Teams = Awaited<ReturnType<typeof prisma.g15Team.findMany>>;
type Matches = Awaited<ReturnType<typeof prisma.g15Match.findMany>>;

function NationalStandings({ teams, matches }: { teams: Teams; matches: Matches }) {
  // มีนัดรอบแบ่งกลุ่มกำลังแข่ง → ตารางคะแนนสด (นับสกอร์ปัจจุบันเหมือนจบแล้ว) ส่วนสายน็อกเอาต์ยังใช้ผลจริงเท่านั้น
  const liveTable = matches.some((m) => isGroupRound(m.round) && hasLiveScore(m));
  const groups = getNationalStandings(teams, liveTable ? projectLive(matches) : matches);
  const groupMatches = matches.filter((m) => isGroupRound(m.round));
  const formByTeamId = new Map(teams.map((t) => [t.id, getRecentForm(t.id, groupMatches)]));
  const ties = getNationalBracket(teams, matches);

  if (groups.length === 0) {
    return (
      <div className="relative z-10 -mt-10 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-xl shadow-g15-950/10 sm:-mt-14">
        <Trophy className="h-8 w-8 text-slate-400" />
        <p className="text-sm text-slate-500">ยังไม่ได้จัดกลุ่มรอบชิงแชมป์ประเทศ</p>
        <p className="text-xs text-slate-400">National Round groups not drawn yet</p>
      </div>
    );
  }

  return (
    <div className="relative z-10 -mt-10 space-y-10 sm:-mt-14">
      <Reveal>
        <NationalGroupTables groups={groups} formByTeamId={formByTeamId} live={liveTable} />
      </Reveal>
      <Reveal>
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
            <GitBranch className="h-5 w-5 text-g15-600" />
            รอบน็อกเอาต์ <span className="text-sm font-normal text-slate-400">/ Knockout Stage</span>
          </h2>
          <KnockoutBracket ties={ties} />
        </section>
      </Reveal>
    </div>
  );
}

function RegionalStandings({ teams, matches }: { teams: Teams; matches: Matches }) {
  const standingGroups = getStandings(teams, matches);
  const { regionOrder, byRegion, ungrouped } = groupStandingsByRegion(standingGroups);
  const formByTeamId = new Map(teams.map((t) => [t.id, getRecentForm(t.id, matches)]));

  if (regionOrder.length === 0 && ungrouped.length === 0) {
    return (
      <div className="relative z-10 -mt-10 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-xl shadow-g15-950/10 sm:-mt-14">
        <Trophy className="h-8 w-8 text-slate-400" />
        <p className="text-sm text-slate-500">ยังไม่มีตารางคะแนน</p>
        <p className="text-xs text-slate-400">No standings yet</p>
      </div>
    );
  }

  return (
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
            <div key={group.groupName} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-3">
                <h3 className="font-semibold text-slate-900">{group.groupName}</h3>
              </div>
              <StandingTable group={group} formByTeamId={formByTeamId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
