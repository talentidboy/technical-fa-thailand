"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { STAT_GROUPS, STAT_LABELS, RADAR_AXES, type MatchStatsRow } from "@/lib/talent-match-stats";

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

export function MatchStatsPanel({
  row,
  radarMax,
}: {
  row: MatchStatsRow;
  radarMax: Record<string, number>;
}) {
  const color = row.positionCategory ? POSITION_COLOR[row.positionCategory] : DEFAULT_COLOR;

  const rates = [
    {
      label: "จ่ายแม่น",
      value: rate(row.stats.PASSING ?? 0, (row.stats.PASSING ?? 0) + (row.stats["LOSS PASS"] ?? 0)),
    },
    { label: "ชนะเลี้ยง 1v1", value: rate(row.stats["WIN TAKE ON 1V1"] ?? 0, row.stats["TAKE ON 1V1"] ?? 0) },
    { label: "ยิงเข้ากรอบ", value: rate(row.stats["ON TARGET"] ?? 0, row.stats.SHOT ?? 0) },
  ].filter((r): r is { label: string; value: string } => r.value != null);

  const radarData = RADAR_AXES.map((axis) => {
    const max = radarMax[axis] || 1;
    const value = row.stats[axis] ?? 0;
    return { axis: labelOf(axis), full: Math.round((100 * value) / max) };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
        <p className="text-xs text-indigo-400">
          สถิติการแข่งขันจริงจากตาราง Individual Stats Leg 2 / 2026
        </p>
        {rates.length > 0 && (
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-indigo-300">
            {rates.map((r) => (
              <span key={r.label}>
                {r.label} <span className="font-bold text-amber-300">{r.value}</span>
              </span>
            ))}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-300">
            โปรไฟล์เทียบกับผู้เล่นทั้งหมด
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="#27324a" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "#b6c2d6", fontSize: 10 }} />
                <Radar dataKey="full" stroke={color} fill={color} fillOpacity={0.28} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm">
          {STAT_GROUPS.map((group) => (
            <div key={group.title} className="mb-4 last:mb-0">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-400">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.stats.map((key) => {
                  const value = row.stats[key] ?? 0;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between border-b border-white/5 py-1 text-xs"
                    >
                      <span className="text-indigo-300">{labelOf(key)}</span>
                      <span className={value === 0 ? "font-medium text-indigo-500" : "font-bold text-white"}>
                        {value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
