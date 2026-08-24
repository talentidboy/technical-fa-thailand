"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { STAT_GROUPS, STAT_LABELS, statPercentile, type MatchStatsRow } from "@/lib/talent-match-stats";
import { ratingTier } from "@/lib/rating-scale";

function labelOf(key: string) {
  return STAT_LABELS[key]?.th ?? key;
}

export function TopStatsChart({
  row,
  statsDist,
  limit = 8,
}: {
  row: MatchStatsRow;
  statsDist: Record<string, number[]>;
  limit?: number;
}) {
  const allKeys = STAT_GROUPS.flatMap((g) => g.stats);
  const top = allKeys
    .map((key) => ({
      key,
      name: labelOf(key),
      value: row.stats[key] ?? 0,
      percent: statPercentile(row, key, statsDist),
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  if (top.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-indigo-300">ยังไม่มีสถิติที่บันทึกไว้สำหรับผู้เล่นคนนี้</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, top.length * 36)}>
      <BarChart data={top} layout="vertical" margin={{ left: 0, right: 20, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="0" horizontal={false} stroke="#1c2333" />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#8a98b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={112}
          tick={{ fontSize: 11.5, fill: "#c7d2e8" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as (typeof top)[number];
            const tier = ratingTier(p.percent);
            return (
              <div className="rounded-lg border border-white/10 bg-indigo-950 px-3 py-2 text-xs shadow-xl">
                <p className="font-semibold text-white">{p.name}</p>
                <p className="text-indigo-300">
                  ค่า <span className="font-bold text-white">{p.value}</span> · เปอร์เซ็นไทล์{" "}
                  <span className={`font-bold ${tier.text}`}>{p.percent}</span>
                </p>
              </div>
            );
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={16} animationDuration={500}>
          {top.map((s) => (
            <Cell key={s.key} fill={ratingTier(s.percent).hex} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
