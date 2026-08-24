"use client";

import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import {
  STAT_GROUPS,
  STAT_LABELS,
  RADAR_AXES,
  statPercentile,
  type MatchStatsRow,
} from "@/lib/talent-match-stats";
import { ratingTier } from "@/lib/rating-scale";
import { positionColor } from "@/lib/position-color";
import { TopStatsChart } from "@/components/talent-id/TopStatsChart";

function labelOf(key: string) {
  return STAT_LABELS[key]?.th ?? key;
}

function rate(numerator: number, denominator: number): string | null {
  if (denominator <= 0) return null;
  return `${((100 * numerator) / denominator).toFixed(1)}%`;
}

export function MatchStatsPanel({
  row,
  statsMax,
  statsDist,
}: {
  row: MatchStatsRow;
  statsMax: Record<string, number>;
  statsDist: Record<string, number[]>;
}) {
  const color = positionColor(row.positionCategory);

  const rates = [
    {
      label: "จ่ายแม่น",
      value: rate(row.stats.PASSING ?? 0, (row.stats.PASSING ?? 0) + (row.stats["LOSS PASS"] ?? 0)),
    },
    { label: "ชนะเลี้ยง 1v1", value: rate(row.stats["WIN TAKE ON 1V1"] ?? 0, row.stats["TAKE ON 1V1"] ?? 0) },
    { label: "ยิงเข้ากรอบ", value: rate(row.stats["ON TARGET"] ?? 0, row.stats.SHOT ?? 0) },
  ].filter((r): r is { label: string; value: string } => r.value != null);

  const radarData = RADAR_AXES.map((axis) => {
    const max = statsMax[axis] || 1;
    const value = row.stats[axis] ?? 0;
    return { axis: labelOf(axis), full: Math.round((100 * value) / max) };
  });

  // เฉพาะกลุ่ม/สถิติที่มีค่าจริงมากกว่า 0 เท่านั้น — ตัดแถว 0 ที่ไม่มีความหมายออกจากรายการยาว
  const nonEmptyGroups = STAT_GROUPS.map((group) => ({
    title: group.title,
    stats: group.stats.filter((key) => (row.stats[key] ?? 0) > 0),
  })).filter((g) => g.stats.length > 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5 lg:items-start">
        <div className="rounded-3xl border border-white/10 bg-linear-to-b from-white/6 to-white/2 p-6 lg:col-span-2">
          {rates.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-indigo-300">
              {rates.map((r) => (
                <span key={r.label}>
                  {r.label} <span className="font-bold text-amber-300">{r.value}</span>
                </span>
              ))}
            </div>
          )}

          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-300">
            โปรไฟล์เทียบกับผู้เล่นทั้งหมด
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="#27324a" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "#b6c2d6", fontSize: 10 }} />
                <Radar dataKey="full" stroke={color} fill={color} fillOpacity={0.3} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 lg:col-span-3">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-indigo-300">
            สถิติเด่น (Top 8)
          </h3>
          <TopStatsChart row={row} statsDist={statsDist} />
        </div>
      </div>

      {nonEmptyGroups.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-indigo-300">
            รายละเอียดสถิติทั้งหมด
          </h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {nonEmptyGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-400">
                  {group.title}
                </p>
                <div className="space-y-0.5">
                  {group.stats.map((key) => {
                    const value = row.stats[key] ?? 0;
                    const percent = statPercentile(row, key, statsDist);
                    const tier = ratingTier(percent);
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-2 border-b border-white/5 py-1.5 text-xs"
                      >
                        <span className="min-w-0 flex-1 truncate text-indigo-300">{labelOf(key)}</span>
                        <div className="h-1.5 w-9 flex-none overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.max(8, percent)}%`, backgroundColor: tier.hex }}
                          />
                        </div>
                        <span className={`w-6 flex-none text-right font-bold ${tier.text}`}>{value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
