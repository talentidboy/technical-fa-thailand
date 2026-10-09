import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStandings, getNationalStandings, formatMatchDateTime, type StandingRow } from "@/lib/g15";
import { regionStyle, parseRegionGroup, regionEn } from "@/lib/g15-region";
import { stageInfo, roundStyle, matchWinnerId, hasPenalties, isLive, hasLiveScore, type G15Stage } from "@/lib/g15-stage";
import { LivePill } from "@/components/g15/LivePill";
import { SquadCard } from "@/components/g15/SquadCard";
import { SQUAD_LINES, squadLine, squadLineLabel, staffRank } from "@/lib/g15-squad";
import { getCurrentUser } from "@/lib/auth";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { MapPin, Calendar, ListOrdered, Trophy } from "lucide-react";

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
  const style = regionStyle(parsed?.region ?? null);

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Chrome user={user} />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
          <Link href="/g15-womens-series" className="hover:text-slate-900">
            G15 Women&apos;s Football Series
          </Link>
          {parsed && (
            <>
              <span>›</span>
              <span>
                {parsed.region} <span className="text-slate-300">/ {regionEn(parsed.region)}</span>
              </span>
            </>
          )}
          <span>›</span>
          <span className="font-medium text-slate-600">{team.name}</span>
        </nav>

        {/* การ์ดข้อมูลทีม */}
        <div className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ring-1 ${style.ring}`}>
          <div className={`flex flex-wrap items-center gap-4 px-6 py-5 ${style.bg}`}>
            {team.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={team.logoUrl} alt="" className="h-16 w-16 flex-none rounded-2xl border-2 border-white/30 object-cover" />
            ) : (
              <div className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10 text-2xl font-bold text-white">
                {team.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold text-white sm:text-2xl">{team.name}</h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/80">
                <MapPin className="h-3.5 w-3.5" />
                {team.groupName ?? "ยังไม่จัดกลุ่ม / Not grouped yet"}
              </p>
            </div>
          </div>

          {stageBlocks.map(({ stage: blockStage, title, standing, rank, form: recentForm }) => (
            <div key={blockStage} className="border-t border-slate-100">
              <div className="flex items-center gap-2 bg-slate-50 px-6 py-2.5">
                <Trophy className={`h-3.5 w-3.5 ${blockStage === "NATIONAL" ? "text-g15-600" : "text-slate-400"}`} />
                <p className="text-xs font-bold text-slate-700">{title}</p>
                {rank != null && (
                  <span className="ml-auto rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                    อันดับ {rank} ในกลุ่ม
                  </span>
                )}
              </div>
            {standing && (
              <div className="grid grid-cols-3 gap-px bg-slate-100 sm:grid-cols-7">
                {[
                  { label: "P", title: "แข่ง", value: standing.played },
                  { label: "W", title: "ชนะ", value: standing.won },
                  { label: "D", title: "เสมอ", value: standing.drawn },
                  { label: "L", title: "แพ้", value: standing.lost },
                  { label: "GF", title: "ได้", value: standing.goalsFor },
                  { label: "GA", title: "เสีย", value: standing.goalsAgainst },
                  { label: "Pts", title: "คะแนน", value: standing.points },
                ].map((s) => (
                  <div key={s.label} className="bg-white px-3 py-4 text-center">
                    <p className={`text-lg font-bold ${s.label === "Pts" ? "text-g15-600" : "text-slate-900"}`}>{s.value}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400" title={s.title}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {standing && standing.played > 0 && (
              <div className="border-t border-slate-100 px-6 py-5">
                <p className="mb-2.5 text-xs font-medium text-slate-500">
                  ฟอร์มการแข่งขัน / Form ({standing.played} นัด)
                </p>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                  {standing.won > 0 && (
                    <div className="bg-emerald-500" style={{ width: `${(standing.won / standing.played) * 100}%` }} />
                  )}
                  {standing.drawn > 0 && (
                    <div className="bg-amber-400" style={{ width: `${(standing.drawn / standing.played) * 100}%` }} />
                  )}
                  {standing.lost > 0 && (
                    <div className="bg-red-400" style={{ width: `${(standing.lost / standing.played) * 100}%` }} />
                  )}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {Math.round((standing.won / standing.played) * 100)}% ชนะ / Won {standing.won}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-amber-700">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    {Math.round((standing.drawn / standing.played) * 100)}% เสมอ / Drawn {standing.drawn}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-red-600">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    {Math.round((standing.lost / standing.played) * 100)}% แพ้ / Lost {standing.lost}
                  </span>
                </div>
                {recentForm.length > 0 && (
                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">ฟอร์มล่าสุด / Recent form:</span>
                    {recentForm.map((r, i) => (
                      <span
                        key={i}
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                          r === "W" ? "bg-emerald-500" : r === "D" ? "bg-amber-400" : "bg-red-400"
                        }`}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            </div>
          ))}
        </div>

        {/* รายชื่อนักกีฬา (Squad List) — การ์ดรูปไดคัท จัดกลุ่มตามตำแหน่ง เรียงตามเบอร์เสื้อ */}
        <section className="mt-10">
          <div className="mb-5 flex items-center gap-3">
            <h2 className="text-xl font-black uppercase tracking-wide text-slate-900">Squad List</h2>
            <span className="h-0.5 w-10 rounded-full bg-g15-500" />
            <span className="text-sm text-slate-400">
              นักกีฬา {players.length} คน
            </span>
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
        <section className="mt-10">
          <div className="mb-5 flex items-center gap-3">
            <h2 className="text-xl font-black uppercase tracking-wide text-slate-900">Team Officials</h2>
            <span className="h-0.5 w-10 rounded-full bg-g15-500" />
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

        {/* ตารางการแข่งขันของทีม */}
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
            <ListOrdered className="h-4 w-4" />
            ตารางการแข่งขันของทีม / Fixtures ({allMatches.length})
          </div>
          {allMatches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
              <p>ยังไม่มีนัดการแข่งขันสำหรับทีมนี้</p>
              <p className="mt-0.5 text-xs text-slate-400">No fixtures for this team yet</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <ul className="divide-y divide-slate-100">
                {allMatches.map((match) => {
                  const isHome = match.homeTeamId === id;
                  const opponent = isHome ? match.awayTeam : match.homeTeam;
                  const isFinished = match.status === "FINISHED" && match.homeScore != null && match.awayScore != null;
                  const goalsFor = isFinished ? (isHome ? match.homeScore! : match.awayScore!) : null;
                  const goalsAgainst = isFinished ? (isHome ? match.awayScore! : match.homeScore!) : null;
                  // ชนะ/แพ้จุดโทษในรอบน็อกเอาต์นับเป็นผลชนะ/แพ้ (ไม่ใช่เสมอ)
                  const winnerId = matchWinnerId(match);
                  const outcome = isFinished
                    ? winnerId != null
                      ? winnerId === id
                        ? "W"
                        : "L"
                      : goalsFor === goalsAgainst
                        ? "D"
                        : null
                    : null;
                  const chip = roundStyle(match.round);
                  const outcomeBadge =
                    outcome === "W"
                      ? "bg-emerald-500"
                      : outcome === "D"
                        ? "bg-amber-400"
                        : outcome === "L"
                          ? "bg-red-400"
                          : "bg-slate-200";
                  const scorePill =
                    outcome === "W"
                      ? "bg-emerald-600"
                      : outcome === "D"
                        ? "bg-amber-500"
                        : outcome === "L"
                          ? "bg-red-500"
                          : "bg-g15-600";
                  return (
                    <li key={match.id}>
                    <Link
                      href={`/g15-womens-series/matches/${match.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        {outcome && (
                          <span
                            className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-bold text-white ${outcomeBadge}`}
                          >
                            {outcome}
                          </span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${chip.bg}`}>
                          {match.round}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          {isHome ? "เหย้า / Home" : "เยือน / Away"}
                        </span>
                        <span className="font-medium text-slate-900">พบ / vs {opponent.name}</span>
                        {isFinished ? (
                          <span className={`rounded-lg px-2.5 py-1 text-xs font-bold text-white ${scorePill}`}>
                            {match.homeScore} - {match.awayScore}
                            {hasPenalties(match) && ` (จุดโทษ ${match.homePenalty}-${match.awayPenalty})`}
                          </span>
                        ) : isLive(match) ? (
                          <span className="flex items-center gap-1.5">
                            {hasLiveScore(match) && (
                              <span className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
                                {match.homeScore} - {match.awayScore}
                              </span>
                            )}
                            <LivePill />
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">ยังไม่แข่ง / Not played</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatMatchDateTime(match.matchDate)}
                        </span>
                        {match.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {match.venue}
                          </span>
                        )}
                      </div>
                    </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
