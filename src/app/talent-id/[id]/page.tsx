import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTalentPlayerById } from "@/lib/talent-id";
import {
  getPlayerMatchStatsRow,
  statPercentile,
  STAT_GROUPS,
  STAT_LABELS,
} from "@/lib/talent-match-stats";
import { PositionPitch } from "@/components/PositionPitch";
import { PlayerTabs } from "@/components/talent-id/PlayerTabs";
import { InfoPill } from "@/components/talent-id/InfoPill";
import { Breadcrumb } from "@/components/talent-id/Breadcrumb";
import { MatchStatsPanel } from "@/components/talent-id/MatchStatsPanel";
import { MiniRadar } from "@/components/talent-id/MiniRadar";
import { ratingTier } from "@/lib/rating-scale";
import {
  Ruler,
  Weight,
  Footprints,
  MapPin,
  Video,
  Star,
  Phone,
  Mail,
  MessageCircle,
  IdCard,
  StickyNote,
  Tag,
  TrendingUp,
  Users2,
  Compass,
  Gauge,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

export const fetchCache = "default-cache";

function RatingSparkline({
  points,
}: {
  points: { label: string; value: number | null }[];
}) {
  const valid = points.filter(
    (p): p is { label: string; value: number } => p.value != null,
  );

  if (valid.length === 0) {
    return <p className="text-sm text-indigo-300">ยังไม่มีข้อมูลคะแนนประเมิน</p>;
  }

  if (valid.length === 1) {
    return (
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-amber-400">
          {valid[0].value.toFixed(2)}
        </span>
        <span className="text-sm text-indigo-300">{valid[0].label}</span>
      </div>
    );
  }

  const width = 320;
  const height = 96;
  const pad = 14;
  const max = Math.max(...valid.map((p) => p.value));
  const min = Math.min(...valid.map((p) => p.value));
  const range = max - min || 1;
  const stepX = (width - pad * 2) / (valid.length - 1);

  const coords = valid.map((p, i) => ({
    x: pad + i * stepX,
    y: pad + (1 - (p.value - min) / range) * (height - pad * 2),
    ...p,
  }));

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${height - pad} L ${coords[0].x.toFixed(1)} ${height - pad} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-80">
        <defs>
          <linearGradient id="rating-sparkline-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#rating-sparkline-fill)" />
        <path d={linePath} fill="none" stroke="#fbbf24" strokeWidth="2" />
        {coords.map((c) => (
          <circle
            key={c.label}
            cx={c.x}
            cy={c.y}
            r="4"
            fill="#fbbf24"
            stroke="#1e1b4b"
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="mt-2 flex max-w-80 justify-between text-[11px] text-indigo-300">
        {valid.map((p) => (
          <div key={p.label} className="text-center">
            <p className="font-bold text-white">{p.value.toFixed(2)}</p>
            <p>{p.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoutScoresBars({ scores }: { scores: { label: string; value: number }[] }) {
  if (scores.length === 0) {
    return <p className="text-sm text-indigo-300">ยังไม่มีคะแนนจากสแกาต์</p>;
  }
  const max = Math.max(...scores.map((s) => s.value), 10);

  return (
    <div className="space-y-2.5">
      {scores.map((s) => {
        const percent = Math.min(100, (s.value / max) * 100);
        const tier = ratingTier(percent);
        return (
          <div key={s.label} className="flex items-center gap-3">
            <span className="w-20 flex-none text-xs text-indigo-300">{s.label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full bg-current ${tier.text}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className={`w-8 flex-none rounded-md py-0.5 text-right text-xs font-bold ${tier.text}`}>
              {s.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function AttrRow({ label, value, percent }: { label: string; value: number; percent: number }) {
  const tier = value === 0 ? null : ratingTier(percent);
  return (
    <div className="flex items-center justify-between gap-2 border-b border-white/5 py-1.5 text-xs">
      <span className="text-indigo-300">{label}</span>
      <span
        className={`min-w-8 rounded-md px-1.5 py-0.5 text-center font-bold ${
          tier ? `${tier.bg} ${tier.text}` : "text-indigo-500"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default async function TalentIdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const canSeeContact = user.role === "ADMIN" || user.role === "STAFF";

  const { id } = await params;
  const player = await getTalentPlayerById(id);
  if (!player) notFound();

  const matchStats = await getPlayerMatchStatsRow(player.id).catch(() => null);

  const stats: { icon: typeof Ruler; label: string; value: string }[] = [
    player.height ? { icon: Ruler, label: "ส่วนสูง", value: `${player.height} ซม.` } : null,
    player.weight ? { icon: Weight, label: "น้ำหนัก", value: `${player.weight} กก.` } : null,
    player.bmi ? { icon: Weight, label: "BMI", value: player.bmi.toFixed(1) } : null,
    player.strongFoot ? { icon: Footprints, label: "เท้าถนัด", value: player.strongFoot } : null,
  ].filter((s): s is { icon: typeof Ruler; label: string; value: string } => s !== null);

  const gradeBadges = [
    { label: "Leg 1", value: player.gradeLeg1 },
    { label: "Leg 2", value: player.gradeLeg2 },
    { label: "Camp 2026", value: player.gradeCamp2026 },
  ].filter((g) => g.value);

  const ratingPoints = [
    { label: "Leg 1", value: player.avgRatingLeg1 },
    { label: "Leg 2", value: player.avgRatingLeg2 },
    { label: "Camp 2026", value: player.avgRatingCamp2026 },
  ];

  // จุดแข็ง/จุดที่ควรพัฒนา — คำนวณจาก percentile จริงของสถิติที่ผู้เล่นทำได้ (เฉพาะค่าที่ไม่ใช่ 0
  // เพื่อไม่ให้ "ไม่เคยทำ" ปนกับ "ทำได้น้อย") ไม่ใช่ข้อความที่เขียนเอง
  const scoredStats = matchStats
    ? STAT_GROUPS.flatMap((g) => g.stats)
        .map((key) => ({
          key,
          label: STAT_LABELS[key]?.th ?? key,
          value: matchStats.row.stats[key] ?? 0,
          percent: statPercentile(matchStats.row, key, matchStats.statsDist),
        }))
        .filter((s) => s.value > 0)
    : [];
  const strengths = [...scoredStats].sort((a, b) => b.percent - a.percent).slice(0, 3);
  const weaknesses = [...scoredStats]
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 3)
    .filter((s) => !strengths.some((st) => st.key === s.key));

  const overviewTab = (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
        {/* คอลัมน์ 1 — ตำแหน่งในสนาม */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users2 className="h-4 w-4 text-amber-400" />
            <h2 className="font-semibold text-white">ตำแหน่งในสนาม</h2>
          </div>
          <div className="flex justify-center">
            <PositionPitch primary={player.position1} secondary={player.position2} />
          </div>
          <div className="mt-4 space-y-1.5">
            {player.position1 && (
              <div className="flex items-center justify-between rounded-lg bg-amber-400/10 px-3 py-1.5 text-xs">
                <span className="font-semibold text-amber-300">{player.position1}</span>
                <span className="text-[10px] uppercase tracking-wide text-amber-400/70">หลัก</span>
              </div>
            )}
            {player.position2.map((p) => (
              <div
                key={p}
                className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5 text-xs"
              >
                <span className="text-indigo-200">{p}</span>
                <span className="text-[10px] uppercase tracking-wide text-indigo-400">รอง</span>
              </div>
            ))}
          </div>
        </div>

        {/* คอลัมน์ 2 — คุณลักษณะ (สถิติแข่งจริงจัดหมวด หรือคะแนนสแกาต์ถ้าไม่มีสถิติแข่ง) */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-amber-400" />
            <h2 className="font-semibold text-white">คุณลักษณะ</h2>
          </div>
          {matchStats ? (
            <div className="text-sm">
              {STAT_GROUPS.map((group) => (
                <div key={group.title} className="mb-4 last:mb-0">
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-400">
                    {group.title}
                  </p>
                  <div className="space-y-0.5">
                    {group.stats.map((key) => (
                      <AttrRow
                        key={key}
                        label={STAT_LABELS[key]?.th ?? key}
                        value={matchStats.row.stats[key] ?? 0}
                        percent={statPercentile(matchStats.row, key, matchStats.statsDist)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : player.scoutScores.length > 0 ? (
            <ScoutScoresBars scores={player.scoutScores} />
          ) : (
            <p className="text-sm text-indigo-300">ยังไม่มีข้อมูลเชิงลึกสำหรับผู้เล่นคนนี้</p>
          )}
        </div>

        {/* คอลัมน์ 3 — ข้อมูลนักกีฬา: ร่างกาย, เรดาร์, สแกาต์ (ถ้ายังไม่โชว์คอลัมน์ 2), จุดแข็ง/จุดที่ควรพัฒนา */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Compass className="h-4 w-4 text-amber-400" />
              <h2 className="font-semibold text-white">ข้อมูลนักกีฬา</h2>
            </div>
            <p className="mb-3 flex items-center gap-2 text-xs text-indigo-300">
              <MapPin className="h-3.5 w-3.5 flex-none text-indigo-400" />
              {[player.province, player.region].filter(Boolean).join(" · ") || "-"}
            </p>
            {stats.length > 0 ? (
              <div className="space-y-1">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center justify-between border-b border-white/5 py-1.5 text-xs"
                  >
                    <span className="flex items-center gap-1.5 text-indigo-300">
                      <s.icon className="h-3.5 w-3.5 text-indigo-400" />
                      {s.label}
                    </span>
                    <span className="font-bold text-white">{s.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-indigo-300">ยังไม่มีข้อมูลสถิติร่างกาย</p>
            )}
          </div>

          {matchStats && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-300">
                โปรไฟล์เทียบกับผู้เล่นทั้งหมด
              </h3>
              <MiniRadar row={matchStats.row} statsMax={matchStats.statsMax} />
            </div>
          )}

          {matchStats && player.scoutScores.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400" />
                <h2 className="font-semibold text-white">คะแนนจากสแกาต์รายบุคคล</h2>
              </div>
              <ScoutScoresBars scores={player.scoutScores} />
            </div>
          )}

          {(strengths.length > 0 || weaknesses.length > 0) && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              {strengths.length > 0 && (
                <div className="mb-3 last:mb-0">
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-400">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    จุดแข็ง
                  </div>
                  <ul className="space-y-1">
                    {strengths.map((s) => (
                      <li key={s.key} className="text-xs text-indigo-200">
                        {s.label} <span className="font-bold text-emerald-300">({s.value})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {weaknesses.length > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-rose-400">
                    <ThumbsDown className="h-3.5 w-3.5" />
                    จุดที่ควรพัฒนา
                  </div>
                  <ul className="space-y-1">
                    {weaknesses.map((s) => (
                      <li key={s.key} className="text-xs text-indigo-200">
                        {s.label} <span className="font-bold text-rose-300">({s.value})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {player.talent.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-rose-400" />
            <h2 className="font-semibold text-white">ความสามารถโดดเด่น</h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {player.talent.map((t) => (
              <span
                key={t}
                className="rounded-full bg-rose-400/15 px-2.5 py-1 text-xs font-medium text-rose-300 ring-1 ring-rose-400/20"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {player.tags.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-emerald-400" />
            <h2 className="font-semibold text-white">สถานะการคัดเลือก</h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {player.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/20"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {(gradeBadges.length > 0 || ratingPoints.some((p) => p.value != null)) && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="flex items-center gap-2 border-b border-white/10 px-6 py-4">
            <TrendingUp className="h-4 w-4 text-amber-400" />
            <h2 className="font-semibold text-white">คะแนนตามรอบการประเมิน</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-indigo-400">
                <tr>
                  <th className="px-6 py-2 font-medium">รอบ</th>
                  <th className="px-6 py-2 font-medium">เกรด</th>
                  <th className="px-6 py-2 font-medium">คะแนนเฉลี่ย</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {["Leg 1", "Leg 2", "Camp 2026"].map((label) => {
                  const grade = gradeBadges.find((g) => g.label === label)?.value;
                  const rating = ratingPoints.find((p) => p.label === label)?.value;
                  if (!grade && rating == null) return null;
                  return (
                    <tr key={label}>
                      <td className="px-6 py-2.5 text-indigo-200">{label}</td>
                      <td className="px-6 py-2.5">
                        {grade ? (
                          <span className="rounded-md bg-amber-400/15 px-2 py-0.5 text-xs font-bold text-amber-300">
                            {grade}
                          </span>
                        ) : (
                          <span className="text-indigo-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-2.5 font-bold text-white">
                        {rating != null ? rating.toFixed(2) : <span className="text-indigo-500">-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );

  const ratingsTab = (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-400" />
            <h2 className="font-semibold text-white">แนวโน้มคะแนนประเมิน</h2>
          </div>
          <RatingSparkline points={ratingPoints} />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400" />
            <h2 className="font-semibold text-white">เกรดล่าสุด</h2>
          </div>
          {gradeBadges.length === 0 ? (
            <p className="text-sm text-indigo-300">ยังไม่มีข้อมูลเกรด</p>
          ) : (
            <div className="space-y-2.5">
              {gradeBadges.map((g) => (
                <div key={g.label} className="flex items-center justify-between text-sm">
                  <span className="text-indigo-300">{g.label}</span>
                  <span className="rounded-lg bg-amber-400/15 px-2.5 py-1 font-bold text-amber-300 ring-1 ring-amber-400/30">
                    {g.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );

  const statsTab = matchStats ? (
    <MatchStatsPanel row={matchStats.row} statsMax={matchStats.statsMax} statsDist={matchStats.statsDist} />
  ) : null;

  const mediaTab = (
    <>
      {player.hudlVideoLeg1 || player.hudlVideoLeg2 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Video className="h-4 w-4 text-amber-400" />
            <h2 className="font-semibold text-white">วิดีโอ HUDL</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {player.hudlVideoLeg1 && (
              <a
                href={player.hudlVideoLeg1}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3.5 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-white/10"
              >
                <Video className="h-4 w-4" />
                วิดีโอ Leg 1
              </a>
            )}
            {player.hudlVideoLeg2 && (
              <a
                href={player.hudlVideoLeg2}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3.5 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-white/10"
              >
                <Video className="h-4 w-4" />
                วิดีโอ Leg 2
              </a>
            )}
          </div>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center text-sm text-indigo-300">
          ยังไม่มีวิดีโอสำหรับผู้เล่นคนนี้
        </p>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Talent ID", href: "/talent-id" },
          { label: "ผู้เล่นทั้งหมด", href: "/talent-id/players" },
          { label: player.fullNameTh },
        ]}
      />

      {/* Profile hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-indigo-900 via-indigo-950 to-slate-950 shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-600 via-amber-400 to-amber-600" />
        <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-amber-400 opacity-15 blur-3xl" />
        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-start">
          <div className="flex flex-none items-end gap-4">
            {player.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={player.photoUrl}
                alt=""
                className="h-32 w-32 flex-none rounded-2xl object-cover ring-2 ring-white/15"
              />
            ) : (
              <div className="flex h-32 w-32 flex-none items-center justify-center rounded-2xl bg-white/10 text-4xl font-semibold text-indigo-200 ring-2 ring-white/15">
                {player.fullNameTh.charAt(0)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {player.fullNameTh}
                </h1>
                <p className="mt-0.5 text-sm text-indigo-300">
                  {[player.fullNameEn, player.nickname && `"${player.nickname}"`]
                    .filter(Boolean)
                    .join(" · ") || "-"}
                </p>
              </div>
              {player.playerId != null && (
                <span className="flex-none text-4xl font-black text-white/10 sm:text-5xl">
                  #{player.playerId}
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {player.position1 && (
                <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/30">
                  {player.position1}
                </span>
              )}
              {player.styleOfPlay && (
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-indigo-200">
                  {player.styleOfPlay}
                </span>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <InfoPill label="ปีเกิด" value={player.yearOfBirth ?? "-"} />
              <InfoPill label="ตำแหน่งหลัก" value={player.position1 ?? "-"} accent />
              <InfoPill label="อายุ" value={player.age != null ? `${player.age} ปี` : "-"} />
              <InfoPill label="จังหวัด" value={player.province ?? "-"} />
              <InfoPill label="สโมสร / โรงเรียน" value={player.club || player.school || "-"} />
              <InfoPill label="เท้าถนัด" value={player.strongFoot ?? "-"} />
            </div>
          </div>
        </div>
      </div>

        <PlayerTabs
          overview={overviewTab}
          ratings={ratingsTab}
          stats={statsTab ?? undefined}
          media={mediaTab}
        />

        {/* Contact — ADMIN/STAFF only, always visible regardless of tab */}
        {canSeeContact && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5">
            <div className="flex items-center gap-2 border-b border-amber-400/10 px-6 py-4">
              <IdCard className="h-4 w-4 text-amber-400" />
              <h2 className="font-semibold text-white">
                ข้อมูลติดต่อ (เฉพาะผู้ดูแลระบบ/เจ้าหน้าที่)
              </h2>
            </div>
            <dl className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <IdCard className="h-4 w-4 flex-none text-indigo-400" />
                <span className="text-indigo-100">{player.idCardNumber || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 flex-none text-indigo-400" />
                <span className="text-indigo-100">
                  {player.phone || "-"}
                  {player.emergencyPhone && ` (ฉุกเฉิน: ${player.emergencyPhone})`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 flex-none text-indigo-400" />
                <span className="text-indigo-100">{player.email || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="h-4 w-4 flex-none text-indigo-400" />
                <span className="text-indigo-100">{player.lineId || "-"}</span>
              </div>
            </dl>
            {player.notes && (
              <div className="flex items-start gap-2 border-t border-amber-400/10 px-6 py-4 text-sm">
                <StickyNote className="mt-0.5 h-4 w-4 flex-none text-indigo-400" />
                <p className="text-indigo-100">{player.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
  );
}

