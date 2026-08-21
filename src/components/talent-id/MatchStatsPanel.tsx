"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import {
  STAT_GROUPS,
  STAT_LABELS,
  RADAR_AXES,
  computeFormScore,
  statPercentile,
  type MatchStatsRow,
} from "@/lib/talent-match-stats";
import { ratingTier } from "@/lib/rating-scale";

const POSITION_COLOR: Record<string, string> = {
  FW: "#fbbf24", // amber-400
  MF: "#38bdf8", // sky-400
  DF: "#34d399", // emerald-400
  GK: "#a78bfa", // violet-400
};
const DEFAULT_COLOR = "#818cf8"; // indigo-400

function labelOf(key: string) {
  return STAT_LABELS[key]?.th ?? key;
}

function rate(numerator: number, denominator: number): string | null {
  if (denominator <= 0) return null;
  return `${((100 * numerator) / denominator).toFixed(1)}%`;
}

function StatCell({ label, value, percent }: { label: string; value: number; percent: number }) {
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

export function MatchStatsPanel({
  row,
  statsMax,
  statsDist,
}: {
  row: MatchStatsRow;
  statsMax: Record<string, number>;
  statsDist: Record<string, number[]>;
}) {
  const color = row.positionCategory ? POSITION_COLOR[row.positionCategory] : DEFAULT_COLOR;
  const form = computeFormScore(row, statsDist);
  const formTier = ratingTier(form);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
        <div
          className={`flex h-16 w-16 flex-none flex-col items-center justify-center rounded-2xl ring-2 ${formTier.bg} ${formTier.ring}`}
        >
          <span className={`text-2xl font-black ${formTier.text}`}>{form}</span>
          <span className={`text-[9px] font-semibold uppercase tracking-wide ${formTier.text}`}>ฟอร์ม</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-indigo-400">
            คะแนนฟอร์มรวม ({formTier.label}) — เฉลี่ยเปอร์เซ็นไทล์จาก 8 สถิติหลักเทียบกับผู้เล่นทั้งหมดในทีม
          </p>
          {rates.length > 0 && (
            <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-indigo-300">
              {rates.map((r) => (
                <span key={r.label}>
                  {r.label} <span className="font-bold text-amber-300">{r.value}</span>
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-300">
            โปรไฟล์เทียบกับผู้เล่นทั้งหมด
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="#27324a" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "#b6c2d6", fontSize: 10 }} />
                <Radar dataKey="full" stroke={color} fill={color} fillOpacity={0.28} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-white/10 pt-3">
            {RADAR_AXES.map((axis) => {
              const value = row.stats[axis] ?? 0;
              const percent = statPercentile(row, axis, statsDist);
              const tier = value === 0 ? null : ratingTier(percent);
              return (
                <div key={axis} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-indigo-300">{labelOf(axis)}</span>
                  <span
                    className={`min-w-7 flex-none rounded-md px-1.5 py-0.5 text-center font-bold ${
                      tier ? `${tier.bg} ${tier.text}` : "text-indigo-500"
                    }`}
                  >
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm">
          {STAT_GROUPS.map((group) => (
            <div key={group.title} className="mb-4 last:mb-0">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-400">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.stats.map((key) => (
                  <StatCell
                    key={key}
                    label={labelOf(key)}
                    value={row.stats[key] ?? 0}
                    percent={statPercentile(row, key, statsDist)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
