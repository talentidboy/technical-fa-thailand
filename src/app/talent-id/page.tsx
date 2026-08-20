import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTalentPlayers, type TalentPlayer } from "@/lib/talent-id";
import { LOGO_URL } from "@/lib/brand";
import { TalentIdNav } from "@/components/talent-id/TalentIdNav";
import { DonutChart, CategoryBarChart, CATEGORICAL_PALETTE } from "@/components/DashboardCharts";
import {
  ArrowLeft,
  Target,
  Users,
  ClipboardList,
  Video,
  Star,
  Award,
} from "lucide-react";

function bestGrade(p: TalentPlayer): string | null {
  return p.gradeCamp2026 ?? p.gradeLeg2 ?? p.gradeLeg1 ?? null;
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

export default async function TalentIdHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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

  const gradeDist = countBy(players, bestGrade);
  const positionDist = countBy(players, (p) => p.position1).slice(0, 11);
  const regionDist = countBy(players, (p) => p.region);

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
    { icon: Users, label: "ผู้เล่นทั้งหมด", value: total, accent: "bg-indigo-400/15 text-indigo-300" },
    {
      icon: ClipboardList,
      label: "ยังไม่มีคะแนนประเมิน",
      value: neverRated,
      accent: "bg-red-400/15 text-red-300",
    },
    { icon: Video, label: "มีวิดีโอ HUDL", value: withVideo, accent: "bg-sky-400/15 text-sky-300" },
    {
      icon: Star,
      label: "มีคะแนนจากสแกาต์",
      value: withScoutScores,
      accent: "bg-amber-400/15 text-amber-300",
    },
  ];

  return (
    <div className="min-h-screen bg-indigo-950 text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm font-bold text-white">FA Thailand Technical</p>
              <p className="text-[11px] text-indigo-300">หมวด: Talent ID</p>
            </div>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าแรก
          </Link>
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <div className="pointer-events-none absolute -left-24 -top-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-40 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative">
          <TalentIdNav />
        </div>

        <div className="relative mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30">
            <Target className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">Talent ID</h1>
          <p className="mt-1 max-w-xl text-sm text-indigo-300">
            ศูนย์สืบค้นและคัดกรองนักฟุตบอลผู้มีความสามารถโดดเด่น — ข้อมูลซิงก์จาก Airtable
          </p>
        </div>

        {loadError ? (
          <div className="relative rounded-2xl border border-dashed border-red-400/30 bg-red-400/5 px-6 py-10 text-center text-sm text-red-300">
            ดึงข้อมูลจาก Airtable ไม่สำเร็จ: {loadError}
          </div>
        ) : total === 0 ? (
          <div className="relative flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-16 text-center">
            <Users className="h-8 w-8 text-indigo-400" />
            <p className="text-sm text-indigo-300">ยังไม่มีข้อมูลนักกีฬาใน Airtable</p>
          </div>
        ) : (
          <div className="relative space-y-6">
            {/* KPI */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map(({ icon: Icon, label, value, accent }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div className={`inline-flex rounded-xl p-2.5 ${accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm text-indigo-300">{label}</p>
                  <p className="mt-1 text-3xl font-bold text-white">{value.toLocaleString()}</p>
                </div>
              ))}
            </div>

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
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
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
    </div>
  );
}
