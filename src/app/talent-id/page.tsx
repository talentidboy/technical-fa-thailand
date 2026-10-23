import Link from "next/link";
import { birthYearCE, getTalentPlayers, POSITIONS, REGIONS, YEARS_OF_BIRTH, type TalentPlayer } from "@/lib/talent-id";
import { categoryForPosition, POSITION_COLOR, positionColor } from "@/lib/position-color";
import { Breadcrumb } from "@/components/talent-id/Breadcrumb";
import {
  bestGrade,
  bestRating,
  display,
  GRADE_ORDER,
  gradeHex,
  HBarList,
  Panel,
  ScoreStrip,
  splitLabel,
  TalentPageHead,
  type BarRow,
} from "@/components/talent-id/TalentUi";
import { talentIdBg } from "@/lib/section-images";
import { ArrowRight, Users } from "lucide-react";

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

  const positionRows: BarRow[] = countBy(players, (p) => p.position1).map(({ name, value }) => {
    const { th, en } = splitLabel(name);
    return { key: name, label: th, sub: en, value, color: positionColor(categoryForPosition(name)), href: POSITIONS.includes(name) ? playersHref("position", name) : undefined };
  });
  const regionRows: BarRow[] = countBy(players, (p) => p.region).map(({ name, value }) => {
    const { th, en } = splitLabel(name);
    return { key: name, label: th, sub: en, value, href: REGIONS.includes(name) ? playersHref("region", name) : undefined };
  });

  const topRated = players
    .map((p) => ({ player: p, rating: bestRating(p) }))
    .filter((r): r is { player: TalentPlayer; rating: number } => r.rating != null)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

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
    <div>
      <Breadcrumb items={[{ label: "Talent ID" }, { label: "ภาพรวม" }]} />
      <TalentPageHead
        eyebrow="Talent Identification"
        title="Talent ID"
        image={talentIdBg}
        sub="ศูนย์สืบค้นและคัดกรองนักฟุตบอลผู้มีความสามารถโดดเด่น — ข้อมูลซิงก์จาก Airtable"
        aside={
          <Link href="/talent-id/players" className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-indigo-950 hover:bg-amber-300">
            ค้นหาผู้เล่น
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {loadError ? (
        <div className="rounded-xl border border-dashed border-red-400/30 bg-red-400/5 px-6 py-10 text-center text-sm text-red-300">ดึงข้อมูลจาก Airtable ไม่สำเร็จ: {loadError}</div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/15 px-6 py-16 text-center">
          <Users className="h-8 w-8 text-indigo-400" />
          <p className="text-sm text-indigo-300">ยังไม่มีข้อมูลนักกีฬาใน Airtable</p>
        </div>
      ) : (
        <div className="space-y-5">
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

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            {/* รุ่นปีเกิด */}
            <Panel
              eyebrow="Birth-year cohorts"
              title="ผู้เล่นแยกตามรุ่นปีเกิด"
              className="lg:col-span-3"
              action={unknownYear > 0 ? <span className="text-xs text-indigo-400">ไม่ระบุปีเกิด {unknownYear.toLocaleString()} คน</span> : undefined}
            >
              {cohorts.length === 0 ? (
                <p className="py-8 text-center text-sm text-indigo-400">ยังไม่มีข้อมูลปีเกิด</p>
              ) : (
                <>
                  <div className="flex h-52 items-end gap-2 sm:gap-3">
                    {cohorts.map((c) => {
                      const bar = (
                        <>
                          <span className="text-sm font-semibold tabular-nums text-white">{c.value.toLocaleString()}</span>
                          <span
                            className="mt-1.5 block w-full rounded-t-md bg-amber-400 transition-colors group-hover:bg-amber-300"
                            style={{ height: `${(c.value / cohortMax) * 82}%`, minHeight: 2 }}
                          />
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
                        <p className={`${h} text-base font-semibold text-white`}>{c.year}</p>
                        <p className="text-[11px] text-indigo-400">อายุ {thisYear - c.year} ปี</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Panel>

            {/* เกรด */}
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
                    ได้รับเกรดแล้ว <b className={`${h} text-2xl font-semibold text-white`}>{graded.toLocaleString()}</b> คน
                    <span className="text-indigo-400"> จาก {total.toLocaleString()}</span>
                  </p>
                  <div className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full">
                    {grades.map((g) => (
                      <span key={g.grade} title={`เกรด ${g.grade}: ${g.value.toLocaleString()} คน`} style={{ width: `${(g.value / graded) * 100}%`, minWidth: 3, background: gradeHex(g.grade) }} />
                    ))}
                  </div>
                  <ul className="mt-5 grid grid-cols-2 gap-x-5 gap-y-1 sm:grid-cols-3 lg:grid-cols-2">
                    {grades.map((g) => (
                      <li key={g.grade}>
                        <Link href={`/talent-id/standouts#grade-${g.grade.replace("+", "plus")}`} className="flex items-center gap-2.5 rounded-md py-1.5 text-sm hover:bg-white/5">
                          <span className="h-2.5 w-2.5 flex-none rounded-sm" style={{ background: gradeHex(g.grade) }} />
                          <span className={`${h} w-7 font-semibold text-white`}>{g.grade}</span>
                          <span className="ml-auto tabular-nums text-indigo-100">{g.value.toLocaleString()}</span>
                          <span className="w-12 text-right text-xs tabular-nums text-indigo-400">{((g.value / graded) * 100).toFixed(1)}%</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* อันดับคะแนน */}
            <Panel
              eyebrow="Top rated"
              title="ผู้เล่นคะแนนสูงสุด"
              action={
                <Link href="/talent-id/standouts" className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 hover:text-amber-200">
                  ดูทั้งหมดตามเกรด <ArrowRight className="h-3 w-3" />
                </Link>
              }
            >
              {topRated.length === 0 ? (
                <p className="py-8 text-center text-sm text-indigo-400">ยังไม่มีผู้เล่นที่มีคะแนนประเมิน</p>
              ) : (
                <ol className="divide-y divide-white/8">
                  {topRated.map(({ player, rating }, i) => {
                    const grade = bestGrade(player);
                    const year = birthYearCE(player.yearOfBirth);
                    return (
                      <li key={player.id}>
                        <Link href={`/talent-id/${player.id}`} className="group -mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-white/5">
                          <span className={`${h} w-6 flex-none text-right text-lg font-semibold ${i < 3 ? "text-amber-300" : "text-indigo-400"}`}>{i + 1}</span>
                          {player.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={player.photoUrl} alt="" className="h-9 w-9 flex-none rounded-full border-2 object-cover" style={{ borderColor: positionColor(categoryForPosition(player.position1?.trim())) }} />
                          ) : (
                            <span
                              className="flex h-9 w-9 flex-none items-center justify-center rounded-full border-2 bg-indigo-900 text-sm font-semibold text-indigo-200"
                              style={{ borderColor: positionColor(categoryForPosition(player.position1?.trim())) }}
                            >
                              {player.fullNameTh.charAt(0)}
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-white group-hover:text-amber-300">{player.fullNameTh}</span>
                            <span className="block truncate text-xs text-indigo-400">
                              {[player.position1 ? splitLabel(player.position1).th : null, year ? `เกิด ${year}` : null, player.club || player.school].filter(Boolean).join(" · ") || "-"}
                            </span>
                          </span>
                          {grade && (
                            <span className={`${h} w-7 flex-none text-center text-sm font-semibold`} style={{ color: gradeHex(grade) }} title={`เกรด ${grade}`}>
                              {grade}
                            </span>
                          )}
                          <span className={`${h} w-12 flex-none text-right text-lg font-semibold tabular-nums text-white`}>{rating.toFixed(2)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Panel>

            {/* ตำแหน่ง */}
            <Panel eyebrow="Positions" title="ผู้เล่นแยกตามตำแหน่ง">
              <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-indigo-300">
                {POSITION_GROUPS.map((g) => (
                  <span key={g.key} className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: POSITION_COLOR[g.key] }} />
                    {g.label}
                  </span>
                ))}
              </div>
              <HBarList rows={positionRows} />
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel eyebrow="Regions" title="ผู้เล่นแยกตามภูมิภาค">
              <HBarList rows={regionRows} color="#87a4d9" />
            </Panel>
            {tagRows.length > 0 && (
              <Panel eyebrow="Selection status" title="สถานะการคัดเลือกที่พบบ่อย">
                <HBarList rows={tagRows} total={total} />
              </Panel>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
