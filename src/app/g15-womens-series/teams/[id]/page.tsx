import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStandings, getNationalStandings, formatMatchDateTime, type StandingRow } from "@/lib/g15";
import { parseRegionGroup, regionEn } from "@/lib/g15-region";
import { stageInfo, roundStyle, matchWinnerId, hasPenalties, isLive, hasLiveScore, type G15Stage } from "@/lib/g15-stage";
import { LivePill } from "@/components/g15/LivePill";
import { SquadCard } from "@/components/g15/SquadCard";
import { SQUAD_LINES, squadLine, squadLineLabel, staffRank } from "@/lib/g15-squad";
import { getCurrentUser } from "@/lib/auth";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { HeroArt } from "@/components/g15/HeroArt";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { Reveal } from "@/components/g15/Reveal";
import { Bebas_Neue } from "next/font/google";
import { MapPin, Calendar, Trophy, Users, Shirt } from "lucide-react";

// ตัวอักษรแคบสูงสำหรับชื่อทีม/หัวข้อ/ตัวเลข (ชุดเดียวกับหน้าสถิติและโปรไฟล์นักกีฬา)
const display = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });

// หน้านี้เปิดให้ดูได้แบบสาธารณะไม่ต้องล็อกอิน — ต้องล็อกอินเฉพาะตอนจะ "จัดการข้อมูล" เท่านั้น
export default async function G15TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const [user, team] = await Promise.all([getCurrentUser(), prisma.g15Team.findUnique({ where: { id } })]);
  if (!team) notFound();

  const [allTeams, allMatchesForStandings, allMatches, players, officials] = await Promise.all([
    prisma.g15Team.findMany(),
    prisma.g15Match.findMany(),
    prisma.g15Match.findMany({
      where: { OR: [{ homeTeamId: id }, { awayTeamId: id }] },
      orderBy: [{ matchDate: "desc" }, { createdAt: "desc" }],
      include: { homeTeam: true, awayTeam: true },
    }),
    // ไม่ดึง idCardNumber/passportNumber มาเลย — ข้อมูลอ่อนไหวเก็บไว้ในฐานข้อมูลอย่างเดียว ไม่แสดงผลที่ไหน
    prisma.g15Player.findMany({
      where: { teamId: id, isActive: true },
      orderBy: { no: "asc" },
      select: {
        id: true,
        no: true,
        firstNameTh: true,
        lastNameTh: true,
        firstNameEn: true,
        lastNameEn: true,
        nationality: true,
        jerseyNumber: true,
        position: true,
        photoUrl: true,
      },
    }),
    prisma.g15Official.findMany({
      where: { teamId: id, isActive: true },
      orderBy: { no: "asc" },
      select: {
        id: true,
        no: true,
        firstNameTh: true,
        lastNameTh: true,
        firstNameEn: true,
        lastNameEn: true,
        gender: true,
        nationality: true,
        role: true,
        coachingLicense: true,
        photoUrl: true,
      },
    }),
  ]);

  // สถิติแยกตามรอบ — รอบชิงแชมป์ประเทศนับใหม่จากศูนย์ ไม่รวมผลรอบภูมิภาค
  // รอบชิงแชมป์ประเทศใช้แถวจากตารางกลุ่ม (A/B) เพื่อโชว์อันดับในกลุ่มด้วย
  const stageBlocks: { stage: G15Stage; title: string; standing: StandingRow | undefined; rank: number | null; form: ("W" | "D" | "L")[] }[] = [];
  if (team.nationalGroup) {
    const group = getNationalStandings(allTeams, allMatchesForStandings).find((g) => g.rows.some((r) => r.teamId === id));
    const index = group?.rows.findIndex((r) => r.teamId === id) ?? -1;
    stageBlocks.push({
      stage: "NATIONAL",
      title: `${stageInfo("NATIONAL").label} · ${group?.groupName ?? ""}`,
      standing: index >= 0 ? group!.rows[index] : undefined,
      rank: index >= 0 ? index + 1 : null,
      form: formOf("NATIONAL"),
    });
  }
  stageBlocks.push({
    stage: "REGIONAL",
    title: `${stageInfo("REGIONAL").label}${team.groupName ? ` · ${team.groupName}` : ""}`,
    standing: getStandings(
      allTeams,
      allMatchesForStandings.filter((m) => m.stage === "REGIONAL"),
    )
      .flatMap((g) => g.rows)
      .find((r) => r.teamId === id),
    rank: null,
    form: formOf("REGIONAL"),
  });

  // ฟอร์ม 5 นัดล่าสุด (W/D/L) ของทีมนี้ในรอบนั้น — allMatches เรียงจากล่าสุดไปเก่าสุด จึงหยิบ 5 ตัวแรกแล้วกลับลำดับให้อ่านซ้าย(เก่า)ไปขวา(ล่าสุด)
  function formOf(stage: G15Stage) {
    return allMatches
      .filter((m) => m.stage === stage && m.status === "FINISHED" && m.homeScore != null && m.awayScore != null)
      .slice(0, 5)
      .reverse()
      .map((m) => {
        const isHome = m.homeTeamId === id;
        const gf = isHome ? m.homeScore! : m.awayScore!;
        const ga = isHome ? m.awayScore! : m.homeScore!;
        return gf > ga ? "W" : gf < ga ? "L" : "D";
      });
  }

  const parsed = parseRegionGroup(team.groupName);
  const nationalBlock = stageBlocks.find((b) => b.stage === "NATIONAL");
  const sectionTitle = `${display.className} text-4xl uppercase leading-none text-g15-900`;
  const heroChip = "inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-g15-100 ring-1 ring-white/15";

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Chrome user={user} />

      {/* ฮีโร่ทีม — พื้นม่วงเข้มชุดเดียวกับหน้ารายละเอียดแมท: โลโก้ใหญ่ + ชื่อทีมตัวโต + ป้ายกลุ่ม/อันดับ */}
      <section className="relative isolate overflow-hidden bg-linear-to-br from-g15-950 via-g15-900 to-g15-700 pb-24 pt-6 sm:pb-28 sm:pt-8">
        <div className="absolute inset-x-0 top-0 h-1.5 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
        <HeroArt />
        <div aria-hidden className="absolute left-1/4 top-1/3 -z-10 h-72 w-2xl -translate-x-1/2 rounded-full bg-g15-400/25 blur-3xl" />
        {/* โลโก้ทีมจางๆ ขนาดใหญ่ด้านหลัง */}
        {team.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={team.logoUrl}
            alt=""
            aria-hidden
            className="pointer-events-none absolute -right-20 top-1/2 -z-10 h-80 w-80 -translate-y-1/2 rounded-full object-cover opacity-[0.08] grayscale sm:right-8 sm:h-96 sm:w-96"
          />
        )}
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-g15-200">
            <Link href="/g15-womens-series" className="transition-colors hover:text-white">
              G15
            </Link>
            <span className="text-g15-400/60">›</span>
            <Link href="/g15-womens-series/teams" className="transition-colors hover:text-white">
              ทีมที่เข้าร่วม
            </Link>
            {parsed && (
              <>
                <span className="text-g15-400/60">›</span>
                <span>
                  {parsed.region} <span className="text-g15-300/70">/ {regionEn(parsed.region)}</span>
                </span>
              </>
            )}
          </nav>

          <div className="mt-6 flex flex-col items-center gap-5 text-center sm:flex-row sm:gap-7 sm:text-left">
            <span className="flex-none rounded-full bg-white p-2 shadow-2xl shadow-black/40 ring-4 ring-white/15">
              <TeamBadge team={team} size="xl" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-300">Team Profile</p>
              <h1 className="mt-1 text-3xl font-extrabold leading-tight text-white drop-shadow sm:text-5xl">{team.name}</h1>
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                {team.nationalGroup && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-bold text-amber-950">
                    <Trophy className="h-3.5 w-3.5" />
                    รอบชิงแชมป์ประเทศ · กลุ่ม {team.nationalGroup}
                    {nationalBlock?.rank != null && nationalBlock.standing && nationalBlock.standing.played > 0 && ` · อันดับ ${nationalBlock.rank}`}
                  </span>
                )}
                <span className={heroChip}>
                  <MapPin className="h-3.5 w-3.5 text-amber-300" />
                  {team.groupName ?? "ยังไม่จัดกลุ่ม / Not grouped yet"}
                </span>
                <span className={heroChip}>
                  <Shirt className="h-3.5 w-3.5 text-amber-300" />
                  นักกีฬา {players.length} คน
                </span>
                <span className={heroChip}>
                  <Users className="h-3.5 w-3.5 text-amber-300" />
                  เจ้าหน้าที่ {officials.length} คน
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 pb-20 sm:px-6">
        {/* สถิติแยกตามรอบ — การ์ดลอยทับขอบล่างของฮีโร่ */}
        <div className="relative z-10 -mt-14 grid gap-4 sm:-mt-16">
          {stageBlocks.map(({ stage: blockStage, title, standing, rank, form: recentForm }, i) => {
            const isNational = blockStage === "NATIONAL";
            return (
              <Reveal key={blockStage} delay={i * 80}>
                <div
                  className={`overflow-hidden rounded-3xl bg-white shadow-xl shadow-g15-950/10 ring-1 ${isNational ? "ring-g15-200" : "ring-slate-200"}`}
                >
                  <div
                    className={`flex items-center gap-2.5 px-5 py-3 sm:px-6 ${
                      isNational ? "bg-linear-to-r from-g15-700 to-g15-500 text-white" : "border-b border-slate-100 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Trophy className={`h-4 w-4 flex-none ${isNational ? "text-amber-300" : "text-slate-400"}`} />
                    <p className="min-w-0 flex-1 truncate text-sm font-bold">{title}</p>
                    {rank != null && standing && standing.played > 0 && (
                      <span className="flex-none rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-black text-amber-950">
                        อันดับ {rank} ในกลุ่ม
                      </span>
                    )}
                  </div>

                  {standing && (
                    <div className="grid grid-cols-4 sm:grid-cols-7">
                      {[
                        { label: "P", title: "แข่ง", value: standing.played },
                        { label: "W", title: "ชนะ", value: standing.won },
                        { label: "D", title: "เสมอ", value: standing.drawn },
                        { label: "L", title: "แพ้", value: standing.lost },
                        { label: "GF", title: "ได้", value: standing.goalsFor },
                        { label: "GA", title: "เสีย", value: standing.goalsAgainst },
                        { label: "PTS", title: "คะแนน", value: standing.points },
                      ].map((s) => {
                        const pts = s.label === "PTS";
                        return (
                          <div
                            key={s.label}
                            className={`border-b border-r border-slate-100 px-2 py-4 text-center ${
                              pts ? "col-span-2 bg-linear-to-br from-g15-600 to-g15-800 sm:col-span-1" : ""
                            }`}
                          >
                            <p className={`${display.className} text-4xl leading-none sm:text-5xl ${pts ? "text-white" : "text-g15-950"}`}>
                              {s.value}
                            </p>
                            <p className={`mt-1 text-[10px] font-semibold uppercase tracking-wider ${pts ? "text-g15-100" : "text-slate-400"}`}>
                              {s.label} <span className="normal-case tracking-normal">· {s.title}</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {standing && standing.played > 0 ? (
                    <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                      <div className="min-w-0 flex-1">
                        <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                          {standing.won > 0 && <div className="bg-emerald-500" style={{ width: `${(standing.won / standing.played) * 100}%` }} />}
                          {standing.drawn > 0 && <div className="bg-amber-400" style={{ width: `${(standing.drawn / standing.played) * 100}%` }} />}
                          {standing.lost > 0 && <div className="bg-red-400" style={{ width: `${(standing.lost / standing.played) * 100}%` }} />}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium">
                          <span className="flex items-center gap-1.5 text-emerald-700">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            ชนะ {Math.round((standing.won / standing.played) * 100)}%
                          </span>
                          <span className="flex items-center gap-1.5 text-amber-700">
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            เสมอ {Math.round((standing.drawn / standing.played) * 100)}%
                          </span>
                          <span className="flex items-center gap-1.5 text-red-600">
                            <span className="h-2 w-2 rounded-full bg-red-400" />
                            แพ้ {Math.round((standing.lost / standing.played) * 100)}%
                          </span>
                        </div>
                      </div>
                      {recentForm.length > 0 && (
                        <div className="flex flex-none items-center gap-1.5">
                          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Form</span>
                          {recentForm.map((r, j) => (
                            <span
                              key={j}
                              className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black text-white shadow-sm ${
                                r === "W" ? "bg-emerald-500" : r === "D" ? "bg-amber-400" : "bg-red-400"
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="px-5 py-4 text-xs text-slate-400 sm:px-6">ยังไม่ได้ลงแข่งในรอบนี้ / No matches played yet</p>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* รายชื่อนักกีฬา (Squad List) — การ์ดรูปไดคัท จัดกลุ่มตามตำแหน่ง เรียงตามเบอร์เสื้อ */}
        <section className="mt-12">
          <div className="mb-5 flex items-center gap-3">
            <h2 className={sectionTitle}>Squad List</h2>
            <span className="h-0.5 w-10 rounded-full bg-amber-400" />
            <span className="text-sm text-slate-400">นักกีฬา {players.length} คน</span>
          </div>
          {players.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
              <p>ยังไม่มีข้อมูลนักกีฬาที่ขึ้นทะเบียนสำหรับทีมนี้</p>
              <p className="mt-0.5 text-xs text-slate-400">No registered players yet</p>
            </div>
          ) : (
            <div className="space-y-8">
              {SQUAD_LINES.map((line) => {
                const group = players
                  .filter((p) => squadLine(p.position) === line.key)
                  .sort((a, b) => (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999));
                if (group.length === 0) return null;
                return (
                  <div key={line.key}>
                    <p className="mb-3 text-xs font-bold uppercase tracking-widest text-g15-600">
                      {line.label} <span className="text-slate-400">/ {line.en}</span>
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
                      {group.map((p) => (
                        <SquadCard
                          key={p.id}
                          href={`/g15-womens-series/players/${p.id}`}
                          photoUrl={p.photoUrl}
                          number={p.jerseyNumber}
                          name={`${p.firstNameTh} ${p.lastNameTh}`}
                          nameEn={[p.firstNameEn, p.lastNameEn].filter(Boolean).join(" ") || null}
                          caption={squadLineLabel(p.position)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* เจ้าหน้าที่ทีม */}
        <section className="mt-12">
          <div className="mb-5 flex items-center gap-3">
            <h2 className={sectionTitle}>Team Officials</h2>
            <span className="h-0.5 w-10 rounded-full bg-amber-400" />
            <span className="text-sm text-slate-400">เจ้าหน้าที่ {officials.length} คน</span>
          </div>
          {officials.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
              <p>ยังไม่มีข้อมูลเจ้าหน้าที่ที่ขึ้นทะเบียนสำหรับทีมนี้</p>
              <p className="mt-0.5 text-xs text-slate-400">No registered staff yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
              {[...officials]
                .sort((a, b) => staffRank(a.role) - staffRank(b.role) || (a.no ?? 99) - (b.no ?? 99))
                .map((o) => (
                  <SquadCard
                    key={o.id}
                    tone="staff"
                    photoUrl={o.photoUrl}
                    name={`${o.firstNameTh} ${o.lastNameTh}`}
                    nameEn={[o.firstNameEn, o.lastNameEn].filter(Boolean).join(" ") || null}
                    caption={[o.role, o.coachingLicense ? `License ${o.coachingLicense}` : null].filter(Boolean).join(" · ") || "เจ้าหน้าที่ทีม"}
                  />
                ))}
            </div>
          )}
        </section>

        {/* ตารางการแข่งขันของทีม — การ์ดต่อนัด: แถบสีผลด้านซ้าย, เหย้า สกอร์ เยือน */}
        <section className="mt-12">
          <div className="mb-5 flex items-center gap-3">
            <h2 className={sectionTitle}>Fixtures</h2>
            <span className="h-0.5 w-10 rounded-full bg-amber-400" />
            <span className="text-sm text-slate-400">ตารางแข่ง {allMatches.length} นัด</span>
          </div>
          {allMatches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
              <p>ยังไม่มีนัดการแข่งขันสำหรับทีมนี้</p>
              <p className="mt-0.5 text-xs text-slate-400">No fixtures for this team yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allMatches.map((match) => {
                const isFinished = match.status === "FINISHED" && match.homeScore != null && match.awayScore != null;
                const live = isLive(match);
                // ชนะ/แพ้จุดโทษในรอบน็อกเอาต์นับเป็นผลชนะ/แพ้ (ไม่ใช่เสมอ)
                const winnerId = matchWinnerId(match);
                const outcome = isFinished ? (winnerId != null ? (winnerId === id ? "W" : "L") : "D") : null;
                const chip = roundStyle(match.round);
                const edge =
                  outcome === "W"
                    ? "bg-emerald-500"
                    : outcome === "D"
                      ? "bg-amber-400"
                      : outcome === "L"
                        ? "bg-red-400"
                        : live
                          ? "bg-red-600"
                          : "bg-slate-200";
                const teamCell = (t: typeof match.homeTeam, side: "home" | "away") => (
                  <span className={`flex min-w-0 flex-1 items-center gap-2 ${side === "home" ? "flex-row-reverse text-right" : ""}`}>
                    <TeamBadge team={t} size="md" />
                    <span className={`line-clamp-2 text-xs leading-snug sm:text-sm ${t.id === id ? "font-bold text-g15-900" : "font-medium text-slate-600"}`}>
                      {t.name}
                    </span>
                  </span>
                );
                return (
                  <Link
                    key={match.id}
                    href={`/g15-womens-series/matches/${match.id}`}
                    className="relative block overflow-hidden rounded-2xl bg-white py-3.5 pl-5 pr-4 shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-g15-200 sm:pl-6 sm:pr-5"
                  >
                    <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${edge}`} />
                    <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      <span className={`rounded-full px-2 py-0.5 font-bold text-white ${chip.bg}`}>{match.round}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatMatchDateTime(match.matchDate)}
                      </span>
                      {match.venue && (
                        <span className="hidden min-w-0 items-center gap-1 sm:flex">
                          <MapPin className="h-3.5 w-3.5 flex-none" />
                          <span className="truncate">{match.venue}</span>
                        </span>
                      )}
                      {outcome && (
                        <span
                          className={`ml-auto rounded-md px-2 py-0.5 text-[10px] font-black text-white ${
                            outcome === "W" ? "bg-emerald-500" : outcome === "D" ? "bg-amber-400" : "bg-red-400"
                          }`}
                        >
                          {outcome === "W" ? "ชนะ / W" : outcome === "D" ? "เสมอ / D" : "แพ้ / L"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {teamCell(match.homeTeam, "home")}
                      <span className="flex flex-none flex-col items-center">
                        {isFinished || (live && hasLiveScore(match)) ? (
                          <span className={`${display.className} rounded-xl px-3 pb-0.5 pt-1 text-3xl leading-none text-white ${live ? "bg-red-600" : "bg-g15-900"}`}>
                            {match.homeScore}
                            <span className="mx-1 text-white/40">:</span>
                            {match.awayScore}
                          </span>
                        ) : (
                          <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-400">VS</span>
                        )}
                        {live && (
                          <span className="mt-1">
                            <LivePill />
                          </span>
                        )}
                        {isFinished && hasPenalties(match) && (
                          <span className="mt-1 text-[10px] font-semibold text-slate-500">
                            จุดโทษ {match.homePenalty}-{match.awayPenalty}
                          </span>
                        )}
                      </span>
                      {teamCell(match.awayTeam, "away")}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
