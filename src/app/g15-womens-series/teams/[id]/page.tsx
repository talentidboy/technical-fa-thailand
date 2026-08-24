import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStandings, formatMatchDateTime } from "@/lib/g15";
import { regionStyle, parseRegionGroup } from "@/lib/g15-region";
import { LOGO_URL } from "@/lib/brand";
import { ArrowLeft, MapPin, Calendar, Users, UserCog, ListOrdered } from "lucide-react";

export default async function G15TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const team = await prisma.g15Team.findUnique({ where: { id } });
  if (!team) notFound();

  const [allTeams, allMatchesForStandings, allMatches, players, officials] = await Promise.all([
    prisma.g15Team.findMany(),
    prisma.g15Match.findMany(),
    prisma.g15Match.findMany({
      where: { OR: [{ homeTeamId: id }, { awayTeamId: id }] },
      orderBy: [{ matchDate: "asc" }, { createdAt: "asc" }],
      include: { homeTeam: true, awayTeam: true },
    }),
    // ไม่ดึง idCardNumber/passportNumber มาเลย — ข้อมูลอ่อนไหวเก็บไว้ในฐานข้อมูลอย่างเดียว ไม่แสดงผลที่ไหน
    prisma.g15Player.findMany({
      where: { teamId: id },
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
      },
    }),
    prisma.g15Official.findMany({
      where: { teamId: id },
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
      },
    }),
  ]);

  const standing = getStandings(allTeams, allMatchesForStandings)
    .flatMap((g) => g.rows)
    .find((r) => r.teamId === id);

  // ฟอร์ม 5 นัดล่าสุด (W/D/L) ของทีมนี้ — allMatches เรียงตามวันแข่งจากเก่าไปใหม่อยู่แล้ว
  const recentForm = allMatches
    .filter((m) => m.status === "FINISHED" && m.homeScore != null && m.awayScore != null)
    .slice(-5)
    .map((m) => {
      const isHome = m.homeTeamId === id;
      const gf = isHome ? m.homeScore! : m.awayScore!;
      const ga = isHome ? m.awayScore! : m.homeScore!;
      return gf > ga ? "W" : gf < ga ? "L" : "D";
    });

  const parsed = parseRegionGroup(team.groupName);
  const style = regionStyle(parsed?.region ?? null);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src={LOGO_URL} alt="FA Thailand" width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />
            <div>
              <p className="text-sm font-bold text-white">FA Thailand Technical</p>
              <p className="text-[11px] text-indigo-300">หมวด: G15 Women&apos;s Football Series</p>
            </div>
          </Link>
          <Link
            href="/g15-womens-series"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้า G15
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
          <Link href="/g15-womens-series" className="hover:text-slate-900">
            G15 Women&apos;s Football Series
          </Link>
          {parsed && (
            <>
              <span>›</span>
              <span>{parsed.region}</span>
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
                {team.groupName ?? "ยังไม่จัดกลุ่ม"}
              </p>
            </div>
          </div>

          {standing && (
            <div className="grid grid-cols-3 gap-px bg-slate-100 sm:grid-cols-7">
              {[
                { label: "แข่ง", value: standing.played },
                { label: "ชนะ", value: standing.won },
                { label: "เสมอ", value: standing.drawn },
                { label: "แพ้", value: standing.lost },
                { label: "ได้", value: standing.goalsFor },
                { label: "เสีย", value: standing.goalsAgainst },
                { label: "คะแนน", value: standing.points },
              ].map((s) => (
                <div key={s.label} className="bg-white px-3 py-4 text-center">
                  <p className={`text-lg font-bold ${s.label === "คะแนน" ? "text-rose-600" : "text-slate-900"}`}>{s.value}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {standing && standing.played > 0 && (
            <div className="border-t border-slate-100 px-6 py-5">
              <p className="mb-2.5 text-xs font-medium text-slate-500">ฟอร์มการแข่งขัน ({standing.played} นัด)</p>
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
                  {Math.round((standing.won / standing.played) * 100)}% ชนะ {standing.won}
                </span>
                <span className="flex items-center gap-1.5 font-medium text-amber-700">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  {Math.round((standing.drawn / standing.played) * 100)}% เสมอ {standing.drawn}
                </span>
                <span className="flex items-center gap-1.5 font-medium text-red-600">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  {Math.round((standing.lost / standing.played) * 100)}% แพ้ {standing.lost}
                </span>
              </div>
              {recentForm.length > 0 && (
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">ฟอร์มล่าสุด:</span>
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

        {/* นักกีฬา */}
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Users className="h-4 w-4" />
            นักกีฬา ({players.length})
          </div>
          {players.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
              ยังไม่มีข้อมูลนักกีฬาที่ขึ้นทะเบียนสำหรับทีมนี้
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="w-12 px-3 py-2.5 text-center">เบอร์</th>
                      <th className="px-3 py-2.5">ชื่อ-นามสกุล</th>
                      <th className="hidden px-3 py-2.5 sm:table-cell">English</th>
                      <th className="px-3 py-2.5">ตำแหน่ง</th>
                      <th className="hidden px-3 py-2.5 md:table-cell">สัญชาติ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {players.map((p) => (
                      <tr key={p.id}>
                        <td className="px-3 py-2.5 text-center">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-xs font-bold text-rose-600">
                            {p.jerseyNumber ?? "-"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 font-medium text-slate-900">
                          {p.firstNameTh} {p.lastNameTh}
                        </td>
                        <td className="hidden whitespace-nowrap px-3 py-2.5 text-slate-500 sm:table-cell">
                          {[p.firstNameEn, p.lastNameEn].filter(Boolean).join(" ") || "-"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{p.position ?? "-"}</td>
                        <td className="hidden whitespace-nowrap px-3 py-2.5 text-slate-500 md:table-cell">
                          {p.nationality ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* เจ้าหน้าที่ */}
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
            <UserCog className="h-4 w-4" />
            เจ้าหน้าที่ ({officials.length})
          </div>
          {officials.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
              ยังไม่มีข้อมูลเจ้าหน้าที่ที่ขึ้นทะเบียนสำหรับทีมนี้
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5">ชื่อ-นามสกุล</th>
                      <th className="px-3 py-2.5">บทบาท</th>
                      <th className="hidden px-3 py-2.5 sm:table-cell">เพศ</th>
                      <th className="hidden px-3 py-2.5 md:table-cell">ใบอนุญาตผู้ฝึกสอน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {officials.map((o) => (
                      <tr key={o.id}>
                        <td className="whitespace-nowrap px-3 py-2.5 font-medium text-slate-900">
                          {o.firstNameTh} {o.lastNameTh}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{o.role ?? "-"}</td>
                        <td className="hidden whitespace-nowrap px-3 py-2.5 text-slate-500 sm:table-cell">
                          {o.gender ?? "-"}
                        </td>
                        <td className="hidden whitespace-nowrap px-3 py-2.5 text-slate-500 md:table-cell">
                          {o.coachingLicense ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ตารางการแข่งขันของทีม */}
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
            <ListOrdered className="h-4 w-4" />
            ตารางการแข่งขันของทีม ({allMatches.length})
          </div>
          {allMatches.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
              ยังไม่มีนัดการแข่งขันสำหรับทีมนี้
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <ul className="divide-y divide-slate-100">
                {allMatches.map((match) => {
                  const isHome = match.homeTeamId === id;
                  const opponent = isHome ? match.awayTeam : match.homeTeam;
                  return (
                    <li key={match.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          {isHome ? "เหย้า" : "เยือน"}
                        </span>
                        <span className="font-medium text-slate-900">พบ {opponent.name}</span>
                        {match.status === "FINISHED" ? (
                          <span className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white">
                            {match.homeScore} - {match.awayScore}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">ยังไม่แข่ง</span>
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
