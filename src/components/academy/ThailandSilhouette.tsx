import map from "@/lib/thailand-map.json";
import styles from "./ThailandMap.module.css";

// จังหวัดที่มีอคาเดมีหนาแน่น (กทม. เชียงใหม่ ชลบุรี ปทุมธานี นครราชสีมา อุบลฯ นนทบุรี) — แค่ตกแต่ง ไม่ใช่ข้อมูลจริงแบบสด
const GLOW = new Set([10, 50, 20, 13, 30, 34, 12]);

// แผนที่ประเทศไทยจางๆ สำหรับพื้นหลังหน้าเข้าสู่ระบบ/สมัคร (เรนเดอร์ฝั่งเซิร์ฟเวอร์ ไม่เพิ่ม JS)
export function ThailandSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${map.width} ${map.height}`} aria-hidden="true" className={className}>
      {map.provinces.map((p) => (
        <path
          key={p.code}
          d={p.d}
          fill={GLOW.has(p.code) ? "rgba(251,191,36,0.22)" : "rgba(255,255,255,0.035)"}
          stroke="rgba(252,211,77,0.22)"
          strokeWidth={0.6}
        />
      ))}
      {map.provinces
        .filter((p) => GLOW.has(p.code))
        .map((p, i) => (
          <g key={p.code}>
            <circle cx={p.cx} cy={p.cy} r={2.6} fill="#fde68a" />
            <circle cx={p.cx} cy={p.cy} r={2.6} fill="none" stroke="#fde68a" strokeWidth={1} className={styles.pulse} style={{ animationDelay: `${i * 260}ms` }} />
          </g>
        ))}
    </svg>
  );
}
