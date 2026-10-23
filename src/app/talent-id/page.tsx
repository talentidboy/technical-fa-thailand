import Link from "next/link";
import Image from "next/image";
import { birthYearCE, getTalentPlayers, POSITIONS, REGIONS, YEARS_OF_BIRTH, type TalentPlayer } from "@/lib/talent-id";
import { categoryForPosition, POSITION_COLOR, positionColor } from "@/lib/position-color";
import { bestGrade, bestRating, display, GRADE_ORDER, gradeHex, HBarList, Panel, ScoreStrip, splitLabel, type BarRow } from "@/components/talent-id/TalentUi";
import { FormationMap, POSITION_ABBR } from "@/components/talent-id/FormationMap";
import { talentIdBg } from "@/lib/section-images";
import { ArrowRight, Search, Trophy, Users } from "lucide-react";

export const fetchCache = "default-cache";

const h = display.className;

function hasAnyRating(p: TalentPlayer): boolean {
  return p.avgRatingLeg1 != null || p.avgRatingLeg2 != null || p.avgRatingCamp2026 != null;
}

// นับตามค่าที่เลือก (ตัดช่องว่างหัวท้าย — ใน Airtable บางค่ามีเว้นวรรคท้าย) เรียงมาก → น้อย
function countBy(players: TalentPlayer[], pick: (p: TalentPlayer) => string | null) {
  const counts = new Map<string, number>();
  for (const p of players) {
    const key = pick(p)?.trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

const playersHref = (key: string, value: string) => `/talent-id/players?${new URLSearchParams({ [key]: value })}`;

const POSITION_GROUPS = [
  { key: "GK", label: "ผู้รักษาประตู" },
  { key: "DF", label: "กองหลัง" },
  { key: "MF", label: "กองกลาง" },
  { key: "FW", label: "กองหน้า" },
] as const;

// มุมกรอบแบบช่องมองกล้อง (สื่อถึงการ "สืบค้น/ส่อง" นักเตะ)
function Viewfinder() {
  const c = "absolute h-7 w-7 border-amber-300";
  return (
    <>
      <span aria-hidden className={`${c} left-4 top-4 border-l-2 border-t-2`} />
      <span aria-hidden className={`${c} right-4 top-4 border-r-2 border-t-2`} />
      <span aria-hidden className={`${c} bottom-4 left-4 border-b-2 border-l-2`} />
      <span aria-hidden className={`${c} bottom-4 right-4 border-b-2 border-r-2`} />
    </>
  );
}

export default async function TalentIdHomePage() {
  let players: TalentPlayer[] = [];
  let loadError: string | null = null;
  try {
    players = await getTalentPlayers();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "ไม่สามารถดึงข้อมูลจาก Airtable ได้";
  }

  const total = players.length;
  const neverRated = players.filter((p) => !hasAnyRating(p)).length;
  const withVideo = players.filter((p) => p.hudlVideoLeg1 || p.hudlVideoLeg2).length;
  const withScoutScores = players.filter((p) => p.scoutScores.length > 0).length;
  const avgAge = average(players.map((p) => p.age).filter((v): v is number => v != null));
  const avgHeight = average(players.map((p) => p.height).filter((v): v is number => v != null));
  const thisYear = Number(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }).slice(0, 4));

  // รุ่นปีเกิด (ค.ศ.) — ลิงก์ไปหน้ารายชื่อที่กรองตามปีเกิด (ค่าต้องตรงกับตัวเลือกใน Airtable)
  const cohortMap = new Map<number, { value: number; raw: string | null }>();
  for (const p of players) {
    const y = birthYearCE(p.yearOfBirth);
    if (!y) continue;
    const c = cohortMap.get(y) ?? { value: 0, raw: null };
    c.value += 1;
    const raw = p.yearOfBirth?.trim() ?? null;
    if (!c.raw && raw && YEARS_OF_BIRTH.includes(raw)) c.raw = raw;
    cohortMap.set(y, c);
  }
  const cohorts = Array.from(cohortMap.entries())
    .map(([year, c]) => ({ year, ...c }))
    .sort((a, b) => a.year - b.year);
  const cohortMax = Math.max(1, ...cohorts.map((c) => c.value));
  const unknownYear = total - cohorts.reduce((s, c) => s + c.value, 0);

  const gradeCounts = countBy(players, bestGrade);
  const grades = GRADE_ORDER.map((grade) => ({ grade, value: gradeCounts.find((g) => g.name === grade)?.value ?? 0 })).filter((g) => g.value > 0);
  const graded = grades.reduce((s, g) => s + g.value, 0);

  const positionCounts = Object.fromEntries(countBy(players, (p) => p.position1).map(({ name, value }) => [name, value]));
  const regionRows: BarRow[] = countBy(players, (p) => p.region).map(({ name, value }) => {
    const { th, en } = splitLabel(name);
    return { key: name, label: th, sub: en, value, href: REGIONS.includes(name) ? playersHref("region", name) : undefined };
  });

  const topRated = players
    .map((p) => ({ player: p, rating: bestRating(p) }))
    .filter((r): r is { player: TalentPlayer; rating: number } => r.rating != null)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);

  // แท็กสถานะการคัดเลือก (Longlist, Top U14 ฯลฯ) รวมทุกคน
  const tagCounts = new Map<string, number>();
  for (const p of players) {
    for (const t of p.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  const tagRows: BarRow[] = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, value]) => ({ key: tag, label: tag, value }));

  return (
    <div className="space-y-5">
      {/* ===== ฮีโร่: ช่องมองหานักเตะ ===== */}
      <section className="relative isolate overflow-hidden rounded-2xl border border-white/10">
        <Image src={talentIdBg} alt="" fill priority placeholder="blur" sizes="(min-width: 1280px) 80rem, 100vw" className="-z-10 object-cover object-[50%_55%] grayscale" />
        <div className="absolute inset-0 -z-10 bg-indigo-950/80" />
        <Viewfinder />
        <div className="grid grid-cols-1 gap-10 px-7 pb-10 pt-12 sm:px-12 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300" />
              </span>
              Scouting database · Airtable
            </p>
            <h1 className={`${h} mt-4 text-6xl font-bold uppercase leading-[0.9] tracking-tight sm:text-8xl`}>
              Talent<span className="text-amber-300">ID</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-indigo-200 sm:text-base">ศูนย์สืบค้นและคัดกรองนักฟุตบอลผู้มีความสามารถโดดเด่น — ข้อมูลซิงก์จาก Airtable</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/talent-id/players" className="inline-flex h-11 items-center gap-2 rounded-lg bg-amber-300 px-5 text-sm font-semibold text-indigo-950 hover:bg-amber-200">
                <Search className="h-4 w-4" />
                ค้นหาผู้เล่น
              </Link>
              <Link href="/talent-id/standouts" className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/25 px-5 text-sm font-semibold text-white hover:bg-white/10">
                <Trophy className="h-4 w-4" />
                ผู้เล่นโดดเด่นตามเกรด
              </Link>
            </div>
          </div>
          {!loadError && total > 0 && (
            <div className="lg:text-right">
              <p className="text-xs text-indigo-300">ผู้เล่นในฐานข้อมูล</p>
              <p className={`${h} text-6xl font-bold leading-none tabular-nums text-amber-300 sm:text-7xl`}>{total.toLocaleString()}</p>
              <p className="mt-2 text-xs text-indigo-300">
                ได้รับเกรดแล้ว <b className="font-semibold text-white">{graded.toLocaleString()}</b> คน · {cohorts.length} รุ่นปีเกิด
              </p>
            </div>
          )}
        </div>
      </section>

      {loadError ? (
        <div className="rounded-xl border border-dashed border-red-400/30 bg-red-400/5 px-6 py-10 text-center text-sm text-red-300">ดึงข้อมูลจาก Airtable ไม่สำเร็จ: {loadError}</div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/15 px-6 py-16 text-center">
          <Users className="h-8 w-8 text-indigo-400" />
          <p className="text-sm text-indigo-300">ยังไม่มีข้อมูลนักกีฬาใน Airtable</p>
        </div>
      ) : (
        <>
          <ScoreStrip
            className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
            items={[
              { label: "ผู้เล่นทั้งหมด", value: total.toLocaleString(), tone: "amber" },
              { label: "ยังไม่มีคะแนนประเมิน", value: neverRated.toLocaleString() },
              { label: "มีวิดีโอ HUDL", value: withVideo.toLocaleString() },
              { label: "มีคะแนนจากสเกาต์", value: withScoutScores.toLocaleString() },
              { label: "อายุเฉลี่ย", value: avgAge != null ? `${avgAge.toFixed(1)} ปี` : "-" },
              { label: "ส่วนสูงเฉลี่ย", value: avgHeight != null ? `${avgHeight.toFixed(0)} ซม.` : "-" },
            ]}
          />

          {/* ===== ตำแหน่งบนสนาม + เกรด ===== */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <Panel eyebrow="Squad map" title="ผู้เล่นแยกตามตำแหน่ง — บนสนาม" className="lg:col-span-3">
              <FormationMap counts={positionCounts} hrefFor={(p) => (POSITIONS.includes(p) ? playersHref("position", p) : "/talent-id/players")} />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-300">
                <span className="flex flex-wrap gap-x-4 gap-y-1">
                  {POSITION_GROUPS.map((g) => (
                    <span key={g.key} className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: POSITION_COLOR[g.key] }} />
                      {g.label}
                    </span>
                  ))}
                </span>
                <span className="text-indigo-400">ขนาดวง = จำนวนผู้เล่น · กดเพื่อดูรายชื่อ</span>
              </div>
            </Panel>

            <Panel
              eyebrow="Latest grade"
              title="สัดส่วนเกรดล่าสุด"
              className="lg:col-span-2"
              action={
                <Link href="/talent-id/standouts" className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 hover:text-amber-200">
                  ดูตามเกรด <ArrowRight className="h-3 w-3" />
                </Link>
              }
            >
              {graded === 0 ? (
                <p className="py-8 text-center text-sm text-indigo-400">ยังไม่มีข้อมูลเกรด</p>
              ) : (
                <>
                  <p className="text-sm text-indigo-300">
                    ได้รับเกรดแล้ว <b className={`${h} text-3xl font-bold text-white`}>{graded.toLocaleString()}</b> คน
                    <span className="text-indigo-400"> จาก {total.toLocaleString()}</span>
                  </p>
                  <div className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full">
                    {grades.map((g) => (
                      <span key={g.grade} title={`เกรด ${g.grade}: ${g.value.toLocaleString()} คน`} style={{ width: `${(g.value / graded) * 100}%`, minWidth: 3, background: gradeHex(g.grade) }} />
                    ))}
                  </div>
                  <ul className="mt-5 space-y-1">
                    {grades.map((g) => (
                      <li key={g.grade}>
                        <Link href={`/talent-id/standouts#grade-${g.grade.replace("+", "plus")}`} className="flex items-center gap-3 rounded-md px-1 py-1.5 text-sm hover:bg-white/5">
                          <span className={`${h} w-8 text-lg font-bold`} style={{ color: gradeHex(g.grade) }}>
                            {g.grade}
                          </span>
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                            <span className="block h-full rounded-full" style={{ width: `${Math.max(2, (g.value / grades.reduce((m, x) => Math.max(m, x.value), 1)) * 100)}%`, background: gradeHex(g.grade) }} />
                          </span>
                          <span className={`${h} w-14 text-right font-semibold tabular-nums text-white`}>{g.value.toLocaleString()}</span>
                          <span className="w-12 text-right text-xs tabular-nums text-indigo-400">{((g.value / graded) * 100).toFixed(1)}%</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Panel>
          </div>

          {/* ===== ผู้เล่นคะแนนสูงสุด: การ์ดนักเตะ ===== */}
          {topRated.length > 0 && (
            <section className="rounded-xl border border-white/10 bg-indigo-900 p-5 sm:p-6">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-400">Top rated</p>
                  <h2 className={`${h} mt-0.5 text-xl font-semibold text-white`}>ผู้เล่นคะแนนสูงสุด</h2>
                </div>
                <Link href="/talent-id/standouts" className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 hover:text-amber-200">
                  ดูทั้งหมดตามเกรด <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
                {topRated.map(({ player, rating }, i) => {
                  const grade = bestGrade(player);
                  const pos = player.position1?.trim() ?? "";
                  const color = positionColor(categoryForPosition(pos));
                  const year = birthYearCE(player.yearOfBirth);
                  return (
                    <Link
                      key={player.id}
                      href={`/talent-id/${player.id}`}
                      className="group relative flex w-40 flex-none snap-start flex-col overflow-hidden rounded-xl border border-white/10 bg-indigo-950 transition-colors hover:border-amber-300/70 sm:w-44"
                    >
                      <div className="relative aspect-4/5 overflow-hidden bg-indigo-800">
                        {player.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={player.photoUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <span className={`${h} flex h-full w-full items-center justify-center text-5xl font-bold text-indigo-500`}>{player.fullNameTh.charAt(0)}</span>
                        )}
                        <span className="absolute inset-x-0 bottom-0 h-1" style={{ background: color }} />
                        <span className="absolute left-2 top-2 flex flex-col items-center rounded-md bg-indigo-950/90 px-2 py-1 leading-none">
                          <span className={`${h} text-lg font-bold text-amber-300`}>{rating.toFixed(2)}</span>
                          <span className={`${h} mt-0.5 text-[10px] font-semibold text-indigo-200`}>{POSITION_ABBR[pos] ?? "—"}</span>
                        </span>
                        <span className={`${h} absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-sm font-bold ${i < 3 ? "bg-amber-300 text-indigo-950" : "bg-indigo-950/90 text-indigo-200"}`}>
                          {i + 1}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-3">
                        <p className="truncate text-sm font-semibold text-white group-hover:text-amber-300">{player.fullNameTh}</p>
                        <p className="truncate text-xs text-indigo-400">{player.club || player.school || "-"}</p>
                        <p className="mt-auto flex items-center justify-between pt-2 text-[11px] text-indigo-300">
                          <span>{year ? `เกิด ${year}` : "—"}</span>
                          {grade && (
                            <span className={`${h} text-sm font-bold`} style={{ color: gradeHex(grade) }}>
                              {grade}
                            </span>
                          )}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ===== รุ่นปีเกิด + ภูมิภาค ===== */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel
              eyebrow="Birth-year cohorts"
              title="ผู้เล่นแยกตามรุ่นปีเกิด"
              action={unknownYear > 0 ? <span className="text-xs text-indigo-400">ไม่ระบุปีเกิด {unknownYear.toLocaleString()} คน</span> : undefined}
            >
              {cohorts.length === 0 ? (
                <p className="py-8 text-center text-sm text-indigo-400">ยังไม่มีข้อมูลปีเกิด</p>
              ) : (
                <>
                  <div className="flex h-56 items-end gap-2 sm:gap-3">
                    {cohorts.map((c) => {
                      const bar = (
                        <>
                          <span className={`${h} text-sm font-bold tabular-nums text-white`}>{c.value.toLocaleString()}</span>
                          <span className="mt-1.5 block w-full rounded-t-md bg-amber-300 transition-colors group-hover:bg-amber-200" style={{ height: `${(c.value / cohortMax) * 82}%`, minHeight: 2 }} />
                        </>
                      );
                      const title = `เกิดปี ${c.year}: ${c.value.toLocaleString()} คน`;
                      return c.raw ? (
                        <Link key={c.year} href={playersHref("year", c.raw)} title={title} className="group flex h-full flex-1 flex-col items-center justify-end">
                          {bar}
                        </Link>
                      ) : (
                        <span key={c.year} title={title} className="group flex h-full flex-1 flex-col items-center justify-end">
                          {bar}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 border-t border-white/15 pt-2.5 sm:gap-3">
                    {cohorts.map((c) => (
                      <div key={c.year} className="flex-1 text-center">
                        <p className={`${h} text-base font-bold text-white`}>{c.year}</p>
                        <p className="text-[11px] text-indigo-400">อายุ {thisYear - c.year} ปี</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Panel>
            <Panel eyebrow="Regions" title="ผู้เล่นแยกตามภูมิภาค">
              <HBarList rows={regionRows} color="#a6b0bf" />
            </Panel>
          </div>

          {tagRows.length > 0 && (
            <Panel eyebrow="Selection status" title="สถานะการคัดเลือกที่พบบ่อย">
              <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
                <HBarList rows={tagRows.slice(0, Math.ceil(tagRows.length / 2))} total={total} max={tagRows[0].value} />
                <HBarList rows={tagRows.slice(Math.ceil(tagRows.length / 2))} total={total} max={tagRows[0].value} />
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
