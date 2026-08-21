"use client";

import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { RADAR_AXES, STAT_LABELS, type MatchStatsRow } from "@/lib/talent-match-stats";

const POSITION_COLOR: Record<string, string> = {
  FW: "#fbbf24",
  MF: "#38bdf8",
  DF: "#34d399",
  GK: "#a78bfa",
};
const DEFAULT_COLOR = "#818cf8";

export function MiniRadar({ row, statsMax }: { row: MatchStatsRow; statsMax: Record<string, number> }) {
  const color = row.positionCategory ? POSITION_COLOR[row.positionCategory] : DEFAULT_COLOR;
  const data = RADAR_AXES.map((axis) => {
    const max = statsMax[axis] || 1;
    const value = row.stats[axis] ?? 0;
    return { axis: STAT_LABELS[axis]?.th ?? axis, full: Math.round((100 * value) / max) };
  });

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="#27324a" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: "#b6c2d6", fontSize: 9 }} />
          <Radar dataKey="full" stroke={color} fill={color} fillOpacity={0.28} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
