import type { AcademyLevel } from "@/lib/academy";
import { academyPoster } from "@/components/typefaces/academy";
import styles from "./public.module.css";

// แท่นสามมิติแบบโปสเตอร์ FAT Level Academy: ฐานไอโซเมตริก + แท่งสูงต่ำตามระดับ (ขาว/ดำสลับ, เลขอันดับบนหน้าแท่ง)
// + เหรียญบนยอด (พลิกเป็นระยะ) + ป้ายเหลืองบอกจำนวน + กระดาษสีลอย · ชี้แล้วแท่งยกขึ้น กดแล้วกรองทำเนียบตามระดับ
// วาดด้วยรูปทรงล้วน — ห้ามใช้ <g> (ชุดทดสอบแผนที่อ้าง "svg g" ตัวแรกของหน้าเป็นกลุ่มซูมของแผนที่)

const A = 66; // ครึ่งความกว้างของหน้าบนแท่ง
const B = A / 2; // ครึ่งความสูงของหน้าบน (มุมมองไอโซเมตริก 2:1)
export const COIN: Record<AcademyLevel, { face: string; side: string; ring: string; ink: string; letter: string }> = {
  GOLD: { face: "#ffcd2e", side: "#d69a00", ring: "#fff0a8", ink: "#5c3d00", letter: "G" },
  SILVER: { face: "#dfe6ee", side: "#97a4b4", ring: "#ffffff", ink: "#334155", letter: "S" },
  BRONZE: { face: "#f47b3c", side: "#c14d14", ring: "#ffc6a3", ink: "#4a1a04", letter: "B" },
};
const SHADE = {
  white: { top: "#ffffff", left: "#e4edf5", right: "#c3d3e2", rank: "#0b1220" },
  black: { top: "#2b3241", left: "#0f141d", right: "#1b2230", rank: "#ffd426" },
};

// ตำแหน่งแท่ง: เรียงทแยงจากหลังซ้าย (ทอง สูงสุด) มาหน้าขวา (ทองแดง)
const PILLARS: { level: AcademyLevel; rank: number; cx: number; by: number; h: number; tone: keyof typeof SHADE }[] = [
  { level: "GOLD", rank: 1, cx: 108, by: 292, h: 212, tone: "white" },
  { level: "SILVER", rank: 2, cx: 222, by: 349, h: 152, tone: "black" },
  { level: "BRONZE", rank: 3, cx: 336, by: 406, h: 96, tone: "white" },
];

// ฐานใต้แท่ง (รูปข้าวหลามตัดไอโซเมตริก + ความหนา)
const SLAB = { top: [108, 216], left: [-44, 292], bottom: [336, 482], right: [488, 406], depth: 22 } as const;

// กระดาษสีลอย: [x, y, สี, วงกลม?]
const CONFETTI: [number, number, string, boolean][] = [
  [-30, 70, "#ffd426", false],
  [18, 160, "#ffffff", true],
  [-36, 232, "#0b1220", false],
  [292, 46, "#ffffff", false],
  [262, 130, "#0b1220", true],
  [372, 150, "#ffd426", true],
  [520, 26, "#f15a24", false],
  [548, 196, "#0b1220", false],
  [470, 262, "#ffffff", true],
  [556, 330, "#ffd426", false],
];

const pts = (p: readonly (readonly [number, number])[]) => p.map(([x, y]) => `${x},${y}`).join(" ");
const down = ([x, y]: readonly number[]) => [x, y + SLAB.depth] as const;

export function Podium({ counts, className = "" }: { counts: Record<AcademyLevel, number>; className?: string }) {
  const s = SLAB;
  return (
    <svg viewBox="-60 0 640 515" role="img" aria-label={`อคาเดมีที่ได้รับการรับรอง: Gold ${counts.GOLD} · Silver ${counts.SILVER} · Bronze ${counts.BRONZE}`} className={`${academyPoster.className} ${className}`}>
      {/* ฐาน */}
      <polygon className={styles.pillar} points={pts([s.left, s.bottom, down(s.bottom), down(s.left)] as [number, number][])} fill="#0f6aa8" />
      <polygon className={styles.pillar} points={pts([s.bottom, s.right, down(s.right), down(s.bottom)] as [number, number][])} fill="#0b578c" />
      <polygon className={styles.pillar} points={pts([s.top, s.right, s.bottom, s.left] as [number, number][])} fill="#5ab6ec" />
      <polygon className={styles.pillar} points={pts([[108, 236], [448, 406], [336, 462], [-4, 292]])} fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="2" strokeDasharray="8 8" />

      {CONFETTI.map(([x, y, fill, round], n) =>
        round ? (
          <circle key={n} className={styles.confetti} style={{ "--i": n } as React.CSSProperties} cx={x} cy={y} r="5" fill={fill} />
        ) : (
          <rect key={n} className={styles.confetti} style={{ "--i": n, "--r": `${((n * 37) % 90) - 45}deg` } as React.CSSProperties} x={x} y={y} width="14" height="6" rx="1.5" fill={fill} />
        ),
      )}

      {PILLARS.map(({ level, rank, cx, by, h, tone }, n) => {
        const ty = by - h;
        const c = SHADE[tone];
        const coin = COIN[level];
        const vars = { "--i": n } as React.CSSProperties;
        const bx = cx + A + 22;
        const boxY = ty - 62;
        return (
          <a key={level} href={`/academies?level=${level}#directory`} aria-label={`ดูอคาเดมีระดับ ${level}`} className={styles.lift}>
            <polygon className={styles.pillar} style={vars} points={pts([[cx - A, ty], [cx, ty + B], [cx, by + B], [cx - A, by]])} fill={c.left} />
            <polygon className={styles.pillar} style={vars} points={pts([[cx, ty + B], [cx + A, ty], [cx + A, by], [cx, by + B]])} fill={c.right} />
            <polygon className={styles.pillar} style={vars} points={pts([[cx, ty - B], [cx + A, ty], [cx, ty + B], [cx - A, ty]])} fill={c.top} />
            {/* เลขอันดับบนหน้าขวาของแท่ง (เอียงตามหน้าแท่ง) */}
            <text className={styles.fade} style={vars} transform={`matrix(1 -0.5 0 1 ${cx + 20} ${ty + B + 40})`} fontSize="40" fontWeight="800" fill={c.rank}>
              {rank}
            </text>
            {/* เหรียญวางบนยอด: ขอบล่าง + ตัวเหรียญ + หน้าเหรียญ + วงใน + ตัวอักษร */}
            <ellipse className={styles.bob} style={vars} cx={cx} cy={ty - 6} rx={42} ry={21} fill={coin.side} />
            <rect className={styles.bob} style={vars} x={cx - 42} y={ty - 20} width={84} height={14} fill={coin.side} />
            <ellipse className={styles.bob} style={vars} cx={cx} cy={ty - 20} rx={42} ry={21} fill={coin.face} />
            <ellipse className={styles.bob} style={vars} cx={cx} cy={ty - 20} rx={32} ry={16} fill="none" stroke={coin.ring} strokeWidth="2.5" />
            <text className={styles.bob} style={vars} x={cx} y={ty - 13} textAnchor="middle" fontSize="22" fontWeight="800" fill={coin.ink}>
              {coin.letter}
            </text>
            {/* ป้ายเหลือง + เส้นชี้ */}
            <line className={styles.coin} style={vars} x1={cx + 30} y1={ty - 24} x2={bx} y2={boxY + 27} stroke="#0b1220" strokeWidth="2" />
            <circle className={styles.coin} style={vars} cx={cx + 30} cy={ty - 24} r="4" fill="#0b1220" />
            <rect className={styles.coin} style={vars} x={bx + 4} y={boxY + 4} width={140} height={54} rx={12} fill="#0b1220" />
            <rect className={styles.coin} style={vars} x={bx} y={boxY} width={140} height={54} rx={12} fill="#ffd426" />
            <text className={styles.coin} style={vars} x={bx + 14} y={boxY + 21} fontSize="12" fontWeight="700" letterSpacing="1.5" fill="#0b1220">
              {`FAT ${level}`}
            </text>
            <text className={styles.coin} style={vars} x={bx + 14} y={boxY + 44} fontSize="20" fontWeight="800" fill="#0b1220">
              {counts[level].toLocaleString("en-US")} อคาเดมี
            </text>
          </a>
        );
      })}
    </svg>
  );
}
