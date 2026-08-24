import Link from "next/link";
import { getTalentPlayers, type TalentPlayer } from "@/lib/talent-id";
import { positionColor, categoryForPosition } from "@/lib/position-color";
import { Trophy, Medal, Crown, Award } from "lucide-react";
import { Breadcrumb } from "@/components/talent-id/Breadcrumb";

export const fetchCache = "default-cache";

// ลำดับเกรดจริงตาม Airtable (GRADE LEG1 / Leg 2 / Camp 2026 field options) — ไม่ได้เดา
const GRADE_ORDER = ["A", "B+", "B", "C+", "C", "D+", "D"];

// สีประจำระดับเกรด (จัดกลุ่มเอง ไม่ใช่ค่าจาก Airtable) ให้แต่ละโซนดูแตกต่างกันชัดเจน
// แทนที่จะเป็นสีอำพันซ้ำทุกเกรดเหมือนเดิม
const GRADE_STYLE: Record<string, { hex: string; text: string; bg: string; ring: string }> = {
  A: { hex: "#fbbf24", text: "text-amber-300", bg: "bg-amber-400/15", ring: "ring-amber-400/30" },
  "B+": { hex: "#38bdf8", text: "text-sky-300", bg: "bg-sky-400/15", ring: "ring-sky-400/30" },
  B: { hex: "#38bdf8", text: "text-sky-300", bg: "bg-sky-400/15", ring: "ring-sky-400/30" },
  "C+": { hex: "#34d399", text: "text-emerald-300", bg: "bg-emerald-400/15", ring: "ring-emerald-400/30" },
  C: { hex: "#34d399", text: "text-emerald-300", bg: "bg-emerald-400/15", ring: "ring-emerald-400/30" },
  "D+": { hex: "#a78bfa", text: "text-violet-300", bg: "bg-violet-400/15", ring: "ring-violet-400/30" },
  D: { hex: "#a78bfa", text: "text-violet-300", bg: "bg-violet-400/15", ring: "ring-violet-400/30" },
};
const DEFAULT_GRADE_STYLE = { hex: "#818cf8", text: "text-indigo-300", bg: "bg-indigo-400/15", ring: "ring-indigo-400/30" };

function gradeStyle(grade: string) {
  return GRADE_STYLE[grade] ?? DEFAULT_GRADE_STYLE;
}

function bestGrade(p: TalentPlayer): string | null {
  return p.gradeCamp2026 ?? p.gradeLeg2 ?? p.gradeLeg1 ?? null;
}

function bestRating(p: TalentPlayer): number | null {
  return p.avgRatingCamp2026 ?? p.avgRatingLeg2 ?? p.avgRatingLeg1 ?? null;
}

function initials(name: string) {
  return name.trim().charAt(0) || "?";
}

function RankBadge({ rank, color }: { rank: number; color: string }) {
  if (rank === 1) {
    return (
      <div className="absolute -left-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-lg">
        <Crown className="h-3.5 w-3.5" />
      </div>
    );
  }
  if (rank === 2 || rank === 3) {
    return (
      <div
        className={`absolute -left-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black shadow-lg ${
          rank === 2 ? "bg-slate-300 text-slate-900" : "bg-orange-400 text-orange-950"
        }`}
      >
        {rank}
      </div>
    );
  }
  return (
    <div
      className="absolute -left-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-indigo-950 text-[11px] font-bold text-indigo-300"
      style={{ boxShadow: `inset 0 0 0 1px ${color}33` }}
    >
      {rank}
    </div>
  );
}

function PlayerGradeCard({ player, rank, grade }: { player: TalentPlayer; rank: number; grade: string }) {
  const rating = bestRating(player);
  const color = positionColor(categoryForPosition(player.position1));
  const style = gradeStyle(grade);

  return (
    <Link
      href={`/talent-id/${player.id}`}
      className="group relative flex items-center gap-3 rounded-2xl border border-white/10 bg-linear-to-b from-white/7 to-white/2 p-3.5 transition-all hover:-translate-y-0.5 hover:border-white/20"
    >
      <RankBadge rank={rank} color={style.hex} />
      {player.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={player.photoUrl}
          alt=""
          className="h-11 w-11 flex-none rounded-full border-2 object-cover"
          style={{ borderColor: color }}
        />
      ) : (
        <div
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full border-2 bg-indigo-950 text-sm font-semibold text-indigo-200"
          style={{ borderColor: color }}
        >
          {initials(player.fullNameTh)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white group-hover:text-amber-300">
          {player.fullNameTh}
        </p>
        <p className="truncate text-xs text-indigo-400">
          {[player.position1, player.club || player.school].filter(Boolean).join(" · ") || "-"}
        </p>
      </div>
      {rating != null && (
        <span className={`flex-none rounded-lg px-2.5 py-1 text-xs font-bold ${style.bg} ${style.text}`}>
          {rating.toFixed(2)}
        </span>
      )}
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
    players: graded
      .filter((p) => bestGrade(p) === grade)
      .sort((a, b) => (bestRating(b) ?? -1) - (bestRating(a) ?? -1)),
  })).filter((g) => g.players.length > 0);

  const champion = groups[0]?.players[0];
  const championColor = champion ? positionColor(categoryForPosition(champion.position1)) : null;

  return (
    <div>
      <Breadcrumb items={[{ label: "Talent ID", href: "/talent-id" }, { label: "ผู้เล่นโดดเด่นตามเกรด" }]} />
      <div className="mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30">
          <Trophy className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-white">ผู้เล่นโดดเด่นตามเกรด</h1>
        <p className="mt-1 max-w-xl text-sm text-indigo-300">
          จัดอันดับผู้เล่นในแต่ละเกรด เรียงตามคะแนนประเมินล่าสุด (Camp 2026 → Leg 2 → Leg 1)
        </p>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-dashed border-red-400/30 bg-red-400/5 px-6 py-10 text-center text-sm text-red-300">
          ดึงข้อมูลจาก Airtable ไม่สำเร็จ: {loadError}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-16 text-center">
          <Medal className="h-8 w-8 text-indigo-400" />
          <p className="text-sm text-indigo-300">ยังไม่มีผู้เล่นที่ได้รับเกรด</p>
        </div>
      ) : (
        <div className="space-y-8">
          {champion && championColor && (
            <Link
              href={`/talent-id/${champion.id}`}
              className="group relative block overflow-hidden rounded-2xl border border-amber-400/20 bg-linear-to-br from-indigo-900 via-indigo-950 to-slate-950 shadow-xl transition-colors hover:border-amber-400/40"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-amber-400 opacity-15 blur-3xl" />
              <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
                <div className="relative flex-none">
                  {champion.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={champion.photoUrl}
                      alt=""
                      className="h-24 w-24 rounded-2xl border-2 object-cover ring-2 ring-white/10 sm:h-28 sm:w-28"
                      style={{ borderColor: championColor }}
                    />
                  ) : (
                    <div
                      className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 bg-indigo-950 text-3xl font-semibold text-indigo-200 ring-2 ring-white/10 sm:h-28 sm:w-28"
                      style={{ borderColor: championColor }}
                    >
                      {initials(champion.fullNameTh)}
                    </div>
                  )}
                  <div className="absolute -bottom-3 -right-3 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-indigo-950 bg-amber-400 text-amber-950 shadow-lg">
                    <Crown className="h-6 w-6" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                    ผู้เล่นโดดเด่นอันดับ 1 โดยรวม
                  </p>
                  <h3 className="mt-1 truncate text-xl font-bold text-white sm:text-2xl">
                    {champion.fullNameTh}
                  </h3>
                  <p className="mt-0.5 truncate text-sm font-medium text-indigo-300">
                    {[champion.position1, champion.club || champion.school].filter(Boolean).join(" · ") || "-"}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-black text-amber-300">{groups[0].grade}</p>
                    <p className="text-[10px] uppercase tracking-wide text-indigo-400">เกรด</p>
                  </div>
                  {bestRating(champion) != null && (
                    <div className="text-center">
                      <p className="text-2xl font-black text-white">{bestRating(champion)?.toFixed(2)}</p>
                      <p className="text-[10px] uppercase tracking-wide text-indigo-400">คะแนน</p>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )}

          {groups.map(({ grade, players: gradePlayers }) => {
            const style = gradeStyle(grade);
            return (
              <section key={grade}>
                <div className="mb-3 flex items-center gap-2.5">
                  <span
                    className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl text-sm font-black ${style.bg} ${style.text} ring-1 ${style.ring}`}
                  >
                    {grade}
                  </span>
                  <h2 className="font-semibold text-white">เกรด {grade}</h2>
                  <span className="flex items-center gap-1 text-xs text-indigo-400">
                    <Award className="h-3.5 w-3.5" />
                    {gradePlayers.length} คน
                  </span>
                  <div className="ml-2 h-px flex-1" style={{ backgroundColor: `${style.hex}26` }} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {gradePlayers.map((player, i) => (
                    <PlayerGradeCard key={player.id} player={player} rank={i + 1} grade={grade} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
