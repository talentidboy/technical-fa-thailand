import type { AcademyLevel } from "@/lib/academy";
import { academyPoster } from "@/components/typefaces/academy";
import styles from "./public.module.css";

// แท่นสามมิติแบบโปสเตอร์ FAT Level Academy: แท่งสูงต่ำตามระดับ (ขาว/ดำสลับ) + เหรียญบนยอด + ป้ายเหลืองบอกจำนวนอคาเดมี
// วาดด้วยรูปทรงไอโซเมตริกล้วน — ห้ามใช้ <g> (ชุดทดสอบแผนที่อ้าง "svg g" ตัวแรกของหน้าเป็นกลุ่มซูมของแผนที่)

const A = 66; // ครึ่งความกว้างของหน้าบนแท่ง
const B = A / 2; // ครึ่งความสูงของหน้าบน (มุมมองไอโซเมตริก 2:1)
export const COIN: Record<AcademyLevel, { face: string; side: string; ring: string; ink: string; letter: string }> = {
  GOLD: { face: "#ffcd2e", side: "#d69a00", ring: "#fff0a8", ink: "#5c3d00", letter: "G" },
  SILVER: { face: "#dfe6ee", side: "#97a4b4", ring: "#ffffff", ink: "#334155", letter: "S" },
  BRONZE: { face: "#f47b3c", side: "#c14d14", ring: "#ffc6a3", ink: "#4a1a04", letter: "B" },
};
const SHADE = {
  white: { top: "#ffffff", left: "#e4edf5", right: "#c3d3e2" },
  black: { top: "#2b3241", left: "#0f141d", right: "#1b2230" },
};

// ตำแหน่งแท่ง: เรียงทแยงจากหลังซ้าย (ทอง สูงสุด) มาหน้าขวา (ทองแดง)
const PILLARS: { level: AcademyLevel; cx: number; by: number; h: number; tone: keyof typeof SHADE }[] = [
  { level: "GOLD", cx: 108, by: 292, h: 212, tone: "white" },
  { level: "SILVER", cx: 222, by: 349, h: 152, tone: "black" },
  { level: "BRONZE", cx: 336, by: 406, h: 96, tone: "white" },
];

const pts = (p: [number, number][]) => p.map(([x, y]) => `${x},${y}`).join(" ");

export function Podium({ counts, className = "" }: { counts: Record<AcademyLevel, number>; className?: string }) {
  return (
    <svg viewBox="0 0 580 470" role="img" aria-label={`อคาเดมีที่ได้รับการรับรอง: Gold ${counts.GOLD} · Silver ${counts.SILVER} · Bronze ${counts.BRONZE}`} className={`${academyPoster.className} ${className}`}>
      {/* เงาพื้น */}
      <ellipse cx="236" cy="452" rx="210" ry="18" fill="#000" opacity="0.12" />
      {PILLARS.map(({ level, cx, by, h, tone }, n) => {
        const ty = by - h;
        const c = SHADE[tone];
        const coin = COIN[level];
        const vars = { "--i": n } as React.CSSProperties;
        const label = `FAT ${level}`;
        const bx = cx + A + 22;
        const boxY = ty - 62;
        return [
          <polygon key={`${level}-l`} className={styles.pillar} style={vars} points={pts([[cx - A, ty], [cx, ty + B], [cx, by + B], [cx - A, by]])} fill={c.left} />,
          <polygon key={`${level}-r`} className={styles.pillar} style={vars} points={pts([[cx, ty + B], [cx + A, ty], [cx + A, by], [cx, by + B]])} fill={c.right} />,
          <polygon key={`${level}-t`} className={styles.pillar} style={vars} points={pts([[cx, ty - B], [cx + A, ty], [cx, ty + B], [cx - A, ty]])} fill={c.top} />,
          // เหรียญวางบนยอด: ขอบล่าง + ตัวเหรียญ + หน้าเหรียญ + วงใน + ตัวอักษร
          <ellipse key={`${level}-cb`} className={styles.bob} style={vars} cx={cx} cy={ty - 6} rx={42} ry={21} fill={coin.side} />,
          <rect key={`${level}-cs`} className={styles.bob} style={vars} x={cx - 42} y={ty - 20} width={84} height={14} fill={coin.side} />,
          <ellipse key={`${level}-cf`} className={styles.bob} style={vars} cx={cx} cy={ty - 20} rx={42} ry={21} fill={coin.face} />,
          <ellipse key={`${level}-cr`} className={styles.bob} style={vars} cx={cx} cy={ty - 20} rx={32} ry={16} fill="none" stroke={coin.ring} strokeWidth="2.5" />,
          <text key={`${level}-cl`} className={styles.bob} style={vars} x={cx} y={ty - 13} textAnchor="middle" fontSize="22" fontWeight="800" fill={coin.ink}>
            {coin.letter}
          </text>,
          // ป้ายเหลือง + เส้นชี้
          <line key={`${level}-ln`} className={styles.coin} style={vars} x1={cx + 30} y1={ty - 24} x2={bx} y2={boxY + 27} stroke="#0b1220" strokeWidth="2" />,
          <circle key={`${level}-dt`} className={styles.coin} style={vars} cx={cx + 30} cy={ty - 24} r="4" fill="#0b1220" />,
          <rect key={`${level}-bx`} className={styles.coin} style={vars} x={bx} y={boxY} width={140} height={54} rx={12} fill="#ffd426" />,
          <text key={`${level}-t1`} className={styles.coin} style={vars} x={bx + 14} y={boxY + 21} fontSize="12" fontWeight="700" letterSpacing="1.5" fill="#0b1220">
            {label}
          </text>,
          <text key={`${level}-t2`} className={styles.coin} style={vars} x={bx + 14} y={boxY + 44} fontSize="20" fontWeight="800" fill="#0b1220">
            {counts[level].toLocaleString("en-US")} อคาเดมี
          </text>,
        ];
      })}
    </svg>
  );
}
