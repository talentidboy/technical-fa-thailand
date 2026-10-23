import Link from "next/link";
import { getTalentPlayers, type TalentPlayer } from "@/lib/talent-id";
import { positionColor, categoryForPosition } from "@/lib/position-color";
import { Medal } from "lucide-react";
import { Breadcrumb } from "@/components/talent-id/Breadcrumb";
import { bestGrade, bestRating, display, GRADE_ORDER, gradeHex, splitLabel, TalentPageHead } from "@/components/talent-id/TalentUi";

export const fetchCache = "default-cache";

const h = display.className;

function initials(name: string) {
  return name.trim().charAt(0) || "?";
}

function subline(player: TalentPlayer) {
  return [player.position1 ? splitLabel(player.position1).th : null, player.club || player.school].filter(Boolean).join(" · ") || "-";
}

function Avatar({ player, size }: { player: TalentPlayer; size: string }) {
  const color = positionColor(categoryForPosition(player.position1?.trim()));
  return player.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={player.photoUrl} alt="" className={`${size} flex-none rounded-full border-2 object-cover`} style={{ borderColor: color }} />
  ) : (
    <div className={`${size} flex flex-none items-center justify-center rounded-full border-2 bg-indigo-900 text-sm font-semibold text-indigo-200`} style={{ borderColor: color }}>
      {initials(player.fullNameTh)}
    </div>
  );
}

function PlayerGradeCard({ player, rank }: { player: TalentPlayer; rank: number }) {
  const rating = bestRating(player);
  return (
    <Link
      href={`/talent-id/${player.id}`}
      className="group flex items-center gap-3 rounded-lg border border-white/10 bg-indigo-900 px-3.5 py-3 transition-colors hover:border-white/25"
    >
      <span className={`${h} w-6 flex-none text-right text-base font-semibold tabular-nums ${rank <= 3 ? "text-amber-300" : "text-indigo-400"}`}>{rank}</span>
      <Avatar player={player} size="h-10 w-10" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white group-hover:text-amber-300">{player.fullNameTh}</p>
        <p className="truncate text-xs text-indigo-400">{subline(player)}</p>
      </div>
      {rating != null && <span className={`${h} flex-none text-base font-semibold tabular-nums text-white`}>{rating.toFixed(2)}</span>}
    </Link>
  );
}

export default async function TalentIdStandoutsPage() {
  let players: TalentPlayer[] = [];
  let loadError: string | null = null;
  try {
    players = await getTalentPlayers();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "ไม่สามารถดึงข้อมูลจาก Airtable ได้";
  }

  const graded = players.filter((p) => bestGrade(p) != null);
  const groups = GRADE_ORDER.map((grade) => ({
    grade,
    players: graded.filter((p) => bestGrade(p) === grade).sort((a, b) => (bestRating(b) ?? -1) - (bestRating(a) ?? -1)),
  })).filter((g) => g.players.length > 0);

  const champion = groups[0]?.players[0];

  return (
    <div>
      <Breadcrumb items={[{ label: "Talent ID", href: "/talent-id" }, { label: "ผู้เล่นโดดเด่นตามเกรด" }]} />
      <TalentPageHead
        eyebrow="Standouts by grade"
        title="ผู้เล่นโดดเด่นตามเกรด"
        sub="จัดอันดับผู้เล่นในแต่ละเกรด เรียงตามคะแนนประเมินล่าสุด (Camp 2026 → Leg 2 → Leg 1)"
        aside={
          groups.length > 0 ? (
            <nav aria-label="ไปที่เกรด" className="flex flex-wrap gap-1">
              {groups.map((g) => (
                <a
                  key={g.grade}
                  href={`#grade-${g.grade.replace("+", "plus")}`}
                  className={`${h} flex h-9 min-w-9 items-center justify-center rounded-md border border-white/15 px-2 text-sm font-semibold hover:border-white/40`}
                  style={{ color: gradeHex(g.grade) }}
                >
                  {g.grade}
                </a>
              ))}
            </nav>
          ) : undefined
        }
      />

      {loadError ? (
        <div className="rounded-xl border border-dashed border-red-400/30 bg-red-400/5 px-6 py-10 text-center text-sm text-red-300">ดึงข้อมูลจาก Airtable ไม่สำเร็จ: {loadError}</div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/15 px-6 py-16 text-center">
          <Medal className="h-8 w-8 text-indigo-400" />
          <p className="text-sm text-indigo-300">ยังไม่มีผู้เล่นที่ได้รับเกรด</p>
        </div>
      ) : (
        <div className="space-y-10">
          {champion && (
            <Link
              href={`/talent-id/${champion.id}`}
              className="group relative flex flex-col gap-5 overflow-hidden rounded-xl border border-white/10 bg-indigo-900 p-6 transition-colors hover:border-amber-400/40 sm:flex-row sm:items-center sm:p-8"
            >
              <span className="absolute inset-y-0 left-0 w-1 bg-amber-400" />
              <Avatar player={champion} size="h-24 w-24 text-3xl sm:h-28 sm:w-28" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-amber-300">ผู้เล่นโดดเด่นอันดับ 1 โดยรวม</p>
                <h3 className={`${h} mt-1 truncate text-2xl font-semibold text-white sm:text-3xl`}>{champion.fullNameTh}</h3>
                <p className="mt-0.5 truncate text-sm text-indigo-300">{subline(champion)}</p>
              </div>
              <dl className="flex flex-none items-stretch divide-x divide-white/15">
                <div className="pr-6 text-center">
                  <dd className={`${h} text-4xl font-semibold`} style={{ color: gradeHex(groups[0].grade) }}>
                    {groups[0].grade}
                  </dd>
                  <dt className="text-[11px] text-indigo-400">เกรด</dt>
                </div>
                {bestRating(champion) != null && (
                  <div className="pl-6 text-center">
                    <dd className={`${h} text-4xl font-semibold tabular-nums text-white`}>{bestRating(champion)?.toFixed(2)}</dd>
                    <dt className="text-[11px] text-indigo-400">คะแนน</dt>
                  </div>
                )}
              </dl>
            </Link>
          )}

          {groups.map(({ grade, players: gradePlayers }) => (
            <section key={grade} id={`grade-${grade.replace("+", "plus")}`} className="scroll-mt-20">
              <div className="mb-4 flex items-baseline gap-3 border-b border-white/10 pb-3">
                <span className={`${h} text-3xl font-semibold leading-none`} style={{ color: gradeHex(grade) }}>
                  {grade}
                </span>
                <h2 className="font-semibold text-white">เกรด {grade}</h2>
                <span className="text-xs text-indigo-400">{gradePlayers.length} คน</span>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {gradePlayers.map((player, i) => (
                  <PlayerGradeCard key={player.id} player={player} rank={i + 1} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
