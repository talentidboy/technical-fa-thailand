import map from "@/lib/thailand-map.json";

export type ProvinceMarker = { code: number; label: string };

// แผนที่ประเทศไทยระบายสีตามจำนวนต่อจังหวัด (เรนเดอร์ฝั่งเซิร์ฟเวอร์ ไม่ใช้ JS) — ชี้ที่จังหวัดเพื่อดูชื่อ + จำนวน
// สีเดียวไล่อ่อน→เข้มตาม bins (ค่าขั้นต่ำของแต่ละช่วง) · markers = จุด + ป้ายตัวเลขที่จังหวัดเด่น
export function ProvinceMap({
  values,
  bins,
  colors,
  zero = "#e6e8ee",
  unit,
  markers = [],
  markerColor = "#0b1f44",
  className = "",
  title,
}: {
  values: Record<number, number>;
  bins: number[];
  colors: string[];
  zero?: string;
  unit: string;
  markers?: ProvinceMarker[];
  markerColor?: string;
  className?: string;
  title: string;
}) {
  const fill = (n: number) => {
    let c = zero;
    bins.forEach((b, i) => {
      if (n >= b) c = colors[i];
    });
    return c;
  };
  const byCode = new Map(map.provinces.map((p) => [p.code, p]));
  return (
    <svg viewBox={`-8 -8 ${map.width + 16} ${map.height + 16}`} role="img" aria-label={title} className={`block h-auto w-full [&_path]:transition-opacity [&_path:hover]:opacity-75 ${className}`}>
      {map.provinces.map((p) => {
        const n = values[p.code] ?? 0;
        return (
          <path key={p.code} d={p.d} fill={fill(n)} stroke="#ffffff" strokeWidth={0.7}>
            <title>{`${p.th}: ${n.toLocaleString()} ${unit}`}</title>
          </path>
        );
      })}
      {markers.map((m) => {
        const p = byCode.get(m.code);
        if (!p) return null;
        const right = p.cx < map.width * 0.6;
        return (
          <g key={m.code} pointerEvents="none">
            <circle cx={p.cx} cy={p.cy} r={5} fill={markerColor} stroke="#fff" strokeWidth={1.5} />
            <text
              x={p.cx + (right ? 9 : -9)}
              y={p.cy + 4}
              textAnchor={right ? "start" : "end"}
              fontSize={13}
              fontWeight={700}
              fill={markerColor}
              stroke="#fff"
              strokeWidth={3.5}
              paintOrder="stroke"
            >
              {m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ชื่อจังหวัด (ไทย) ↔ รหัสจังหวัดบนแผนที่ (รหัสเดียวกับ geothai)
export const provinceCodeByName = (th: string) => map.provinces.find((p) => p.th === th)?.code ?? null;
export const provinceName = (code: number) => map.provinces.find((p) => p.code === code)?.th ?? `จังหวัด ${code}`;
