"use client";

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
} from "recharts";

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

export function LicenseTrendChart({
  data,
  licenseTypes,
}: {
  data: Record<string, number | string>[];
  licenseTypes: string[];
}) {
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
              id={`fill-${type}`}
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
                stopOpacity={0}
              />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {licenseTypes.map((type) => (
          <Area
            key={type}
            type="monotone"
            dataKey={type}
            name={type}
            stackId="1"
            stroke={LINE_COLORS[type] ?? "#6366f1"}
            fill={`url(#fill-${type})`}
            strokeWidth={2}
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

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
          strokeWidth={2}
          stroke="#ffffff"
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
          {total.toLocaleString()}
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
          formatter={(value: unknown) => {
            const n = Number(value as number);
            return [
              `${n.toLocaleString()} (${total ? ((n / total) * 100).toFixed(1) : 0}%)`,
              "",
            ];
          }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
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
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={50}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" name="จำนวน" fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
