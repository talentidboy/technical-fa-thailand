import { markerFont } from "@/components/typefaces/training";
import styles from "./training.module.css";

// ภาพวาดแทคติกบนไวท์บอร์ด (แบ็คขวาขึ้นสนับสนุนเกมรุกด้านข้าง) — เส้นสนาม ผู้เล่น และลูกศรค่อยๆ ถูกวาดขึ้นตามลำดับ
const BLUE = "#1d4ed8";
const RED = "#dc2626";
const INK = "#111827";

const d = (s: number) => ({ animationDelay: `${s}s` });

function O({ x, y, delay }: { x: number; y: number; delay: number }) {
  return <circle className={styles.pop} style={d(delay)} cx={x} cy={y} r="11" fill="#fdfdfb" stroke={BLUE} strokeWidth="3.5" />;
}

function X({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <g className={styles.pop} style={d(delay)} stroke={RED} strokeWidth="3.8" strokeLinecap="round">
      <line x1={x - 9} y1={y - 9} x2={x + 9} y2={y + 9} />
      <line x1={x + 9} y1={y - 9} x2={x - 9} y2={y + 9} />
    </g>
  );
}

// หัวลูกศร: ปลายเส้นที่ (x, y) ชี้ไปทางมุม angle (องศา)
function Head({ x, y, angle, color, delay }: { x: number; y: number; angle: number; color: string; delay: number }) {
  return <path className={styles.fade} style={d(delay)} d="M0 0 L-13 -7 L-13 7 Z" fill={color} transform={`translate(${x} ${y}) rotate(${angle})`} />;
}

export function TacticsBoard() {
  const pitch = { fill: "none", stroke: BLUE, strokeWidth: 2.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeOpacity: 0.85 };
  const lines = [
    "M30 30 H570 V370 H30 Z",
    "M300 30 V370",
    "M570 110 H480 V290 H570",
    "M570 160 H540 V240 H570",
    "M480 170 A38 38 0 0 0 480 230",
    "M30 110 H120 V290 H30",
    "M30 160 H60 V240 H30",
    "M120 170 A38 38 0 0 1 120 230",
  ];
  return (
    <svg viewBox="0 0 600 410" role="img" aria-label="ภาพวาดแทคติก: แบ็คขวาขึ้นสนับสนุนเกมรุกด้านข้าง" className="block h-auto w-full">
      {lines.map((p, i) => (
        <path key={p} d={p} pathLength={1} className={styles.draw} style={d(i * 0.08)} {...pitch} />
      ))}
      <circle cx="300" cy="200" r="46" pathLength={1} className={styles.draw} style={d(0.5)} {...pitch} />

      {/* ทีมเรา (O) และคู่แข่ง (X) */}
      <O x={250} y={330} delay={0.9} />
      <O x={330} y={215} delay={1.0} />
      <O x={400} y={312} delay={1.1} />
      <O x={468} y={204} delay={1.2} />
      <O x={415} y={92} delay={1.3} />
      <X x={442} y={292} delay={1.35} />
      <X x={505} y={232} delay={1.45} />
      <X x={505} y={165} delay={1.55} />
      <X x={392} y={240} delay={1.65} />

      {/* 1) กองกลางจ่ายให้ปีก */}
      <path className={styles.fade} style={d(1.9)} d="M338 228 L392 300" fill="none" stroke={INK} strokeWidth="2.6" strokeDasharray="8 8" strokeLinecap="round" />
      <Head x={394} y={303} angle={54} color={INK} delay={2.1} />
      {/* 2) แบ็ควิ่งทับทางขึ้นด้านข้าง */}
      <path d="M262 338 C330 384 424 384 488 350" pathLength={1} className={styles.draw} style={d(2.2)} fill="none" stroke={RED} strokeWidth="3.4" strokeLinecap="round" />
      <Head x={490} y={349} angle={-28} color={RED} delay={3.0} />
      {/* 3) ปีกจ่ายเข้าทางวิ่ง */}
      <path className={styles.fade} style={d(3.1)} d="M410 322 L476 342" fill="none" stroke={INK} strokeWidth="2.6" strokeDasharray="8 8" strokeLinecap="round" />
      <Head x={479} y={343} angle={17} color={INK} delay={3.25} />
      {/* 4) เปิดบอลเข้ากลางให้กองหน้า */}
      <path className={styles.fade} style={d(3.4)} d="M500 334 Q526 262 482 220" fill="none" stroke={INK} strokeWidth="2.6" strokeDasharray="8 8" strokeLinecap="round" />
      <Head x={480} y={218} angle={-136} color={INK} delay={3.6} />

      {/* โน้ตลายมือ */}
      <g className={`${markerFont.className} ${styles.fade}`} style={d(3.7)} fill={RED}>
        <text x="44" y="66" fontSize="21">
          Topic: แบ็คขึ้นเกมรุกด้านข้าง
        </text>
        <text x="300" y="402" fontSize="17">
          วิ่งทับทาง ↗
        </text>
      </g>
    </svg>
  );
}
