"use client";

import { useId } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  Sector,
} from "recharts";
import type { PieSectorDataItem } from "recharts";

// ชุดสี categorical ที่ผ่านการตรวจสอบ CVD-safety แล้ว (ลำดับคงที่ ห้ามสลับ —
// ลำดับคือกลไกความปลอดภัยของสี ไม่ใช่ความสวยงาม)
export const CATEGORICAL_PALETTE = [
  "#2a78d6", // 1 blue
  "#eb6834", // 2 orange
  "#1baf7a", // 3 aqua
  "#eda100", // 4 yellow
  "#e87ba4", // 5 magenta
  "#008300", // 6 green
  "#4a3aa7", // 7 violet
  "#e34948", // 8 red
];

// สีสถานะ — คงที่ ไม่ผูกกับ theme ใช้เฉพาะเมื่อสื่อความหมาย good/warning/serious/critical
export const STATUS_COLORS: Record<string, string> = {
  active: "#0ca30c", // good
  expiring: "#fab219", // warning
  expired: "#d03b3b", // critical
  unknown: "#898781", // muted/neutral
};

// ลำดับคงที่ตามพีระมิดใบอนุญาต (ฐานกว้าง G ไปยอด PRO แล้วต่อด้วยสายรอง) —
// ผูกกับ CATEGORICAL_PALETTE ตามตำแหน่ง ห้ามสลับลำดับ
const LICENSE_TYPE_ORDER = ["G", "C", "B", "A", "PRO", "ELITE_YOUTH", "GK", "VDO"];
const LINE_COLORS: Record<string, string> = Object.fromEntries(
  LICENSE_TYPE_ORDER.map((type, i) => [type, CATEGORICAL_PALETTE[i]]),
);

const fmt = (n: number) => n.toLocaleString("th-TH");

// tooltip กลาง ใช้ร่วมกันทุกกราฟ — ค่าตัวใหญ่เด่น ชื่อ series เป็นรอง คั่นด้วยจุดสี (ไม่ใช่กล่อง)
function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="min-w-36 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      {label && (
        <p className="mb-1 text-[11px] font-medium text-slate-400">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={`${p.name}-${i}`} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 flex-none rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-slate-500">{p.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-slate-900">
              {typeof p.value === "number" ? fmt(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LicenseTrendChart({
  data,
  licenseTypes,
}: {
  data: Record<string, number | string>[];
  licenseTypes: string[];
}) {
  const gid = useId();

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        ยังไม่มีข้อมูลใบอนุญาตสำหรับแสดงกราฟ
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          {licenseTypes.map((type) => (
            <linearGradient
              key={type}
              id={`${gid}-fill-${type}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor={LINE_COLORS[type] ?? "#6366f1"}
                stopOpacity={0.35}
              />
              <stop
                offset="95%"
                stopColor={LINE_COLORS[type] ?? "#6366f1"}
                stopOpacity={0.02}
              />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="0" vertical={false} stroke="#eef1f6" />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 12, fill: "#94a3b8" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={fmt}
        />
        <Tooltip content={<ChartTooltipContent />} cursor={{ stroke: "#c7d2fe" }} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#64748b" }}
          iconType="circle"
          iconSize={8}
        />
        {licenseTypes.map((type) => (
          <Area
            key={type}
            type="monotone"
            dataKey={type}
            name={type}
            stackId="1"
            stroke={LINE_COLORS[type] ?? "#6366f1"}
            fill={`url(#${gid}-fill-${type})`}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 2, stroke: "#fff", fill: LINE_COLORS[type] ?? "#6366f1" }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
            animationDuration={600}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data,
  colors,
  emptyMessage,
  centerLabel,
}: {
  data: { key: string; name: string; value: number }[];
  colors?: Record<string, string>;
  emptyMessage: string;
  centerLabel?: string;
}) {
  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  const colorFor = (entry: { key: string }, index: number) =>
    colors?.[entry.key] ?? CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length];
  const total = data.reduce((s, d) => s + d.value, 0);

  const renderActiveShape = (props: PieSectorDataItem) => (
    <Sector
      cx={props.cx}
      cy={props.cy}
      innerRadius={props.innerRadius}
      outerRadius={Number(props.outerRadius) + 6}
      startAngle={props.startAngle}
      endAngle={props.endAngle}
      fill={props.fill}
      cornerRadius={2}
    />
  );

  const renderInactiveShape = (props: PieSectorDataItem) => (
    <Sector
      cx={props.cx}
      cy={props.cy}
      innerRadius={props.innerRadius}
      outerRadius={props.outerRadius}
      startAngle={props.startAngle}
      endAngle={props.endAngle}
      fill={props.fill}
      fillOpacity={0.45}
      cornerRadius={3}
    />
  );

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={58}
          outerRadius={88}
          paddingAngle={3}
          cornerRadius={3}
          strokeWidth={2}
          stroke="#ffffff"
          activeShape={renderActiveShape}
          inactiveShape={renderInactiveShape}
          animationDuration={500}
        >
          {data.map((entry, index) => (
            <Cell key={entry.key} fill={colorFor(entry, index)} />
          ))}
        </Pie>
        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-900 text-xl font-bold"
        >
          {fmt(total)}
        </text>
        {centerLabel && (
          <text
            x="50%"
            y="58%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-slate-400 text-[11px]"
          >
            {centerLabel}
          </text>
        )}
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null;
            const p = payload[0];
            const n = Number(p.value as number);
            return (
              <div className="min-w-32 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2 w-2 flex-none rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-slate-500">{p.name}</span>
                </div>
                <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
                  {fmt(n)}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    ({total ? ((n / total) * 100).toFixed(1) : 0}%)
                  </span>
                </p>
              </div>
            );
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#64748b" }}
          iconType="circle"
          iconSize={8}
          formatter={(value, entry) => {
            const d = (entry as unknown as { payload: { value: number } }).payload;
            return `${value} (${fmt(d.value)})`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MultiSeriesBarChart({
  data,
  xKey,
  series,
  emptyMessage,
  stacked = false,
}: {
  data: Record<string, number | string>[];
  xKey: string;
  series: { key: string; name: string; color: string }[];
  emptyMessage: string;
  stacked?: boolean;
}) {
  const gid = useId();

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barCategoryGap="24%" barGap={4}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`${gid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.95} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.7} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="0" vertical={false} stroke="#eef1f6" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: "#94a3b8" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={fmt}
        />
        <Tooltip content={<ChartTooltipContent />} cursor={{ fill: "#f8fafc" }} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#64748b" }} iconType="circle" iconSize={8} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            fill={`url(#${gid}-${s.key})`}
            stackId={stacked ? "1" : undefined}
            radius={!stacked || i === series.length - 1 ? [4, 4, 0, 0] : undefined}
            maxBarSize={28}
            animationDuration={500}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryBarChart({
  data,
  color = "#1a3a6b",
  emptyMessage,
}: {
  data: { name: string; value: number }[];
  color?: string;
  emptyMessage: string;
}) {
  const gid = useId();

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barCategoryGap="30%">
        <defs>
          <linearGradient id={`${gid}-bar`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.95} />
            <stop offset="100%" stopColor={color} stopOpacity={0.65} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="0" vertical={false} stroke="#eef1f6" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={50}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={fmt}
        />
        <Tooltip content={<ChartTooltipContent />} cursor={{ fill: "#f8fafc" }} />
        <Bar
          dataKey="value"
          name="จำนวน"
          fill={`url(#${gid}-bar)`}
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
          animationDuration={500}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
