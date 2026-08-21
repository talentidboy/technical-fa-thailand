import Link from "next/link";
import { getTalentPlayers, type TalentPlayer } from "@/lib/talent-id";
import { Trophy, Medal } from "lucide-react";
import { Breadcrumb } from "@/components/talent-id/Breadcrumb";

export const fetchCache = "default-cache";

// ลำดับเกรดจริงตาม Airtable (GRADE LEG1 / Leg 2 / Camp 2026 field options) — ไม่ได้เดา
const GRADE_ORDER = ["A", "B+", "B", "C+", "C", "D+", "D"];

function bestGrade(p: TalentPlayer): string | null {
  return p.gradeCamp2026 ?? p.gradeLeg2 ?? p.gradeLeg1 ?? null;
}

function bestRating(p: TalentPlayer): number | null {
  return p.avgRatingCamp2026 ?? p.avgRatingLeg2 ?? p.avgRatingLeg1 ?? null;
}

const RANK_STYLES = [
  "bg-amber-400/20 text-amber-300 ring-amber-400/40",
  "bg-slate-300/15 text-slate-200 ring-slate-300/30",
  "bg-orange-400/15 text-orange-300 ring-orange-400/30",
];

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
          {groups.map(({ grade, players: gradePlayers }) => (
            <section key={grade} className="rounded-2xl border border-white/10 bg-white/5">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/15 text-sm font-bold text-amber-300">
                    {grade}
                  </span>
                  <h2 className="font-semibold text-white">เกรด {grade}</h2>
                </div>
                <span className="text-xs text-indigo-400">{gradePlayers.length} คน</span>
              </div>
              <ul className="divide-y divide-white/10">
                {gradePlayers.map((player, i) => {
                  const rating = bestRating(player);
                  return (
                    <li key={player.id}>
                      <Link
                        href={`/talent-id/${player.id}`}
                        className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-white/5"
                      >
                        <span
                          className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold ring-1 ${
                            RANK_STYLES[i] ?? "bg-white/5 text-indigo-300 ring-white/10"
                          }`}
                        >
                          {i + 1}
                        </span>
                        {player.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={player.photoUrl}
                            alt=""
                            className="h-9 w-9 flex-none rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-indigo-800 text-xs font-semibold text-indigo-200">
                            {player.fullNameTh.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {player.fullNameTh}
                          </p>
                          <p className="truncate text-xs text-indigo-400">
                            {[player.position1, player.club || player.school]
                              .filter(Boolean)
                              .join(" · ") || "-"}
                          </p>
                        </div>
                        {rating != null && (
                          <span className="flex-none rounded-md bg-amber-400/15 px-2.5 py-1 text-xs font-bold text-amber-300">
                            {rating.toFixed(2)}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
