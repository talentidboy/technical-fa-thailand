import Link from "next/link";
import { getTalentPlayers, type TalentPlayer } from "@/lib/talent-id";
import { DonutChart, CategoryBarChart, CATEGORICAL_PALETTE } from "@/components/DashboardCharts";
import {
  Target,
  Users,
  ClipboardList,
  Video,
  Star,
  Award,
  Ruler,
  CalendarClock,
  Crown,
  ArrowRight,
} from "lucide-react";

export const fetchCache = "default-cache";

function bestGrade(p: TalentPlayer): string | null {
  return p.gradeCamp2026 ?? p.gradeLeg2 ?? p.gradeLeg1 ?? null;
}

function bestRating(p: TalentPlayer): number | null {
  return p.avgRatingCamp2026 ?? p.avgRatingLeg2 ?? p.avgRatingLeg1 ?? null;
}

function hasAnyRating(p: TalentPlayer): boolean {
  return p.avgRatingLeg1 != null || p.avgRatingLeg2 != null || p.avgRatingCamp2026 != null;
}

function countBy(players: TalentPlayer[], pick: (p: TalentPlayer) => string | null) {
  const counts = new Map<string, number>();
  for (const p of players) {
    const key = pick(p);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ key: name, name, value }))
    .sort((a, b) => b.value - a.value);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
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

  const gradeDist = countBy(players, bestGrade);
  const positionDist = countBy(players, (p) => p.position1).slice(0, 11);
  const regionDist = countBy(players, (p) => p.region);
  const ageDist = countBy(players, (p) => (p.age != null ? String(p.age) : null)).sort(
    (a, b) => Number(a.name) - Number(b.name),
  );

  const topRated = players
    .map((p) => ({ player: p, rating: bestRating(p) }))
    .filter((r): r is { player: TalentPlayer; rating: number } => r.rating != null)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);

  // นับความถี่แท็กสถานะการคัดเลือกทั้งหมด (Longlist, Top U14 ฯลฯ) รวมทุกคน
  const tagCounts = new Map<string, number>();
  for (const p of players) {
    for (const t of p.tags) {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const stats = [
    { icon: Users, label: "ผู้เล่นทั้งหมด", value: total.toLocaleString(), accent: "bg-indigo-400/15 text-indigo-300" },
    {
      icon: ClipboardList,
      label: "ยังไม่มีคะแนนประเมิน",
      value: neverRated.toLocaleString(),
      accent: "bg-red-400/15 text-red-300",
    },
    { icon: Video, label: "มีวิดีโอ HUDL", value: withVideo.toLocaleString(), accent: "bg-sky-400/15 text-sky-300" },
    {
      icon: Star,
      label: "มีคะแนนจากสแกาต์",
      value: withScoutScores.toLocaleString(),
      accent: "bg-amber-400/15 text-amber-300",
    },
    {
      icon: CalendarClock,
      label: "อายุเฉลี่ย",
      value: avgAge != null ? `${avgAge.toFixed(1)} ปี` : "-",
      accent: "bg-violet-400/15 text-violet-300",
    },
    {
      icon: Ruler,
      label: "ส่วนสูงเฉลี่ย",
      value: avgHeight != null ? `${avgHeight.toFixed(0)} ซม.` : "-",
      accent: "bg-emerald-400/15 text-emerald-300",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30">
          <Target className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-white">Talent ID</h1>
        <p className="mt-1 max-w-xl text-sm text-indigo-300">
          ศูนย์สืบค้นและคัดกรองนักฟุตบอลผู้มีความสามารถโดดเด่น — ข้อมูลซิงก์จาก Airtable
        </p>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-dashed border-red-400/30 bg-red-400/5 px-6 py-10 text-center text-sm text-red-300">
          ดึงข้อมูลจาก Airtable ไม่สำเร็จ: {loadError}
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-16 text-center">
          <Users className="h-8 w-8 text-indigo-400" />
          <p className="text-sm text-indigo-300">ยังไม่มีข้อมูลนักกีฬาใน Airtable</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {stats.map(({ icon: Icon, label, value, accent }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className={`inline-flex rounded-xl p-2.5 ${accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-xs text-indigo-300">{label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* ผู้เล่นคะแนนสูงสุด */}
          {topRated.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-linear-to-br from-amber-400/10 via-white/5 to-white/5 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-400" />
                  <h2 className="font-semibold text-white">ผู้เล่นคะแนนสูงสุด</h2>
                </div>
                <Link
                  href="/talent-id/standouts"
                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 hover:text-amber-200"
                >
                  ดูทั้งหมดตามเกรด
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {topRated.map(({ player, rating }, i) => (
                  <Link
                    key={player.id}
                    href={`/talent-id/${player.id}`}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-4 text-center transition-colors hover:border-amber-400/30"
                  >
                    <span className="text-xs font-bold text-amber-400">#{i + 1}</span>
                    {player.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={player.photoUrl}
                        alt=""
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-800 text-sm font-semibold text-indigo-200">
                        {player.fullNameTh.charAt(0)}
                      </div>
                    )}
                    <p className="truncate text-xs font-medium text-white group-hover:text-amber-300">
                      {player.fullNameTh}
                    </p>
                    <span className="rounded-md bg-amber-400/15 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                      {rating.toFixed(2)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* กราฟภาพรวม */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 font-semibold text-white">สัดส่วนเกรดล่าสุด</h2>
              <DonutChart
                data={gradeDist}
                centerLabel="คน"
                emptyMessage="ยังไม่มีข้อมูลเกรดสำหรับแสดงกราฟ"
              />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 font-semibold text-white">ผู้เล่นแยกตามตำแหน่ง</h2>
              <CategoryBarChart
                data={positionDist}
                color={CATEGORICAL_PALETTE[0]}
                emptyMessage="ยังไม่มีข้อมูลตำแหน่งสำหรับแสดงกราฟ"
              />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 font-semibold text-white">ผู้เล่นแยกตามอายุ</h2>
              <CategoryBarChart
                data={ageDist}
                color={CATEGORICAL_PALETTE[3]}
                emptyMessage="ยังไม่มีข้อมูลอายุสำหรับแสดงกราฟ"
              />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 font-semibold text-white">ผู้เล่นแยกตามภูมิภาค</h2>
              <CategoryBarChart
                data={regionDist}
                color={CATEGORICAL_PALETTE[2]}
                emptyMessage="ยังไม่มีข้อมูลภูมิภาคสำหรับแสดงกราฟ"
              />
            </div>
          </div>

          {/* สถานะการคัดเลือก */}
          {topTags.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" />
                <h2 className="font-semibold text-white">สถานะการคัดเลือกที่พบบ่อย</h2>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {topTags.map(([tag, count]) => (
                  <div
                    key={tag}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm"
                  >
                    <span className="truncate text-indigo-200">{tag}</span>
                    <span className="ml-2 flex-none rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-bold text-amber-300">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
