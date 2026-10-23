import { POSITION_COLOR } from "@/lib/position-color";
import { talentFont } from "@/components/typefaces/talent";

// จำนวนผู้เล่นแต่ละตำแหน่งวางบนสนามจริง (แนวนอน บุกไปทางขวา) — วงใหญ่ = ผู้เล่นมาก · กดวงเพื่อดูรายชื่อตำแหน่งนั้น
// พิกัดเป็น % ของสนาม (x = ความลึกจากประตูตัวเอง, y = ความกว้างจากฝั่งซ้ายของทีม)
const NODES: { key: string; abbr: string; th: string; group: keyof typeof POSITION_COLOR; x: number; y: number }[] = [
  { key: "ผู้รักษาประตู / Goalkeeper", abbr: "GK", th: "ผู้รักษาประตู", group: "GK", x: 5, y: 50 },
  { key: "แบ็คซ้าย / Left Back", abbr: "LB", th: "แบ็คซ้าย", group: "DF", x: 30, y: 11 },
  { key: "เซ็นเตอร์ซ้าย / Left Centerback", abbr: "LCB", th: "เซ็นเตอร์ซ้าย", group: "DF", x: 18, y: 33 },
  { key: "เซ็นเตอร์ขวา / Right Centerback", abbr: "RCB", th: "เซ็นเตอร์ขวา", group: "DF", x: 18, y: 67 },
  { key: "แบ็คขวา / Right Back", abbr: "RB", th: "แบ็คขวา", group: "DF", x: 30, y: 89 },
  { key: "กองกลางตัวรับ / Defensive Midfielder", abbr: "DM", th: "กองกลางตัวรับ", group: "MF", x: 38, y: 50 },
  { key: "กองกลาง / Central Midfielder", abbr: "CM", th: "กองกลาง", group: "MF", x: 52, y: 29 },
  { key: "กองกลางตัวรุก / Attacking Midfielder", abbr: "AM", th: "กองกลางตัวรุก", group: "MF", x: 61, y: 68 },
  { key: "ปีกซ้าย / Left Winger", abbr: "LW", th: "ปีกซ้าย", group: "FW", x: 77, y: 15 },
  { key: "ปีกขวา / Right Winger", abbr: "RW", th: "ปีกขวา", group: "FW", x: 77, y: 85 },
  { key: "หน้าเป้า / Striker", abbr: "ST", th: "หน้าเป้า", group: "FW", x: 89, y: 50 },
];

export const POSITION_ABBR: Record<string, string> = Object.fromEntries(NODES.map((n) => [n.key, n.abbr]));

const W = 160;
const H = 100;

export function FormationMap({ counts, hrefFor }: { counts: Record<string, number>; hrefFor: (position: string) => string }) {
  const max = Math.max(1, ...NODES.map((n) => counts[n.key] ?? 0));
  const total = NODES.reduce((s, n) => s + (counts[n.key] ?? 0), 0);
  const line = { fill: "none", stroke: "#ffffff", strokeOpacity: 0.16, strokeWidth: 0.45 };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="จำนวนผู้เล่นตามตำแหน่งบนสนาม" className={`${talentFont.className} block h-auto w-full`}>
      {/* พื้นสนามแบบแถบตัดหญ้า */}
      <rect x="0" y="0" width={W} height={H} rx="3" fill="#0b1711" />
      {Array.from({ length: 8 }).map((_, i) => (i % 2 ? <rect key={i} x={(W / 8) * i} y="0" width={W / 8} height={H} fill="#0e1d15" /> : null))}
      <rect x="3" y="3" width={W - 6} height={H - 6} {...line} />
      <line x1={W / 2} y1="3" x2={W / 2} y2={H - 3} {...line} />
      <circle cx={W / 2} cy={H / 2} r="12" {...line} />
      <circle cx={W / 2} cy={H / 2} r="0.7" fill="#ffffff" fillOpacity="0.3" />
      <rect x="3" y="24" width="22" height="52" {...line} />
      <rect x="3" y="38" width="8" height="24" {...line} />
      <rect x={W - 25} y="24" width="22" height="52" {...line} />
      <rect x={W - 11} y="38" width="8" height="24" {...line} />
      <path d={`M25 41 A10 10 0 0 1 25 59`} {...line} />
      <path d={`M${W - 25} 41 A10 10 0 0 0 ${W - 25} 59`} {...line} />

      {NODES.map((n) => {
        const c = counts[n.key] ?? 0;
        const r = 3.6 + Math.sqrt(c / max) * 5;
        const cx = (n.x / 100) * W;
        const cy = (n.y / 100) * H;
        const color = POSITION_COLOR[n.group];
        const pct = total ? Math.round((c / total) * 1000) / 10 : 0;
        return (
          <a key={n.key} href={hrefFor(n.key)} className="cursor-pointer [&:hover_circle.dot]:stroke-white">
            <title>{`${n.th} (${n.abbr}): ${c.toLocaleString()} คน · ${pct}%`}</title>
            <circle cx={cx} cy={cy} r={r + 2.2} fill={color} fillOpacity="0.14" />
            <circle className="dot" cx={cx} cy={cy} r={r} fill={color} stroke="#07090d" strokeWidth="0.8" />
            <text x={cx} y={cy + 1.25} textAnchor="middle" fontSize={r > 6.5 ? 3.3 : 2.8} fontWeight={700} fill="#07090d">
              {c.toLocaleString()}
            </text>
            {/* ป้ายชื่อตำแหน่ง: ครึ่งล่างของสนามวางไว้เหนือวง ไม่ให้ตกขอบ */}
            <text x={cx} y={n.y > 70 ? cy - r - 5.6 : cy + r + 4.6} textAnchor="middle" fontSize="2.9" fontWeight={700} fill="#ffffff">
              {n.abbr}
            </text>
            <text x={cx} y={n.y > 70 ? cy - r - 2.2 : cy + r + 8} textAnchor="middle" fontSize="2.4" fill="#a6b0bf">
              {n.th}
            </text>
          </a>
        );
      })}
    </svg>
  );
}
