import { categoryForPosition, positionColor } from "@/lib/position-color";

// พิกัด (%) บนสนามอ้างอิงจากรายชื่อตำแหน่งจริงใน Airtable (1st/2nd Position field)
// วางตามรูปทรงแผนผังทีมมาตรฐาน — GK ล่างสุด ผู้เล่นแนวรุกอยู่บนสุด
const POSITION_COORDS: Record<string, { x: number; y: number }> = {
  "ผู้รักษาประตู / Goalkeeper": { x: 50, y: 92 },
  "แบ็คซ้าย / Left Back": { x: 14, y: 74 },
  "เซ็นเตอร์ซ้าย / Left Centerback": { x: 37, y: 80 },
  "เซ็นเตอร์ขวา / Right Centerback": { x: 63, y: 80 },
  "แบ็คขวา / Right Back": { x: 86, y: 74 },
  "กองกลางตัวรับ / Defensive Midfielder": { x: 50, y: 62 },
  "กองกลาง / Central Midfielder": { x: 50, y: 48 },
  "กองกลางตัวรุก / Attacking Midfielder": { x: 50, y: 34 },
  "กองกลางตัวรุก / Attacking Midfielder ": { x: 50, y: 34 },
  "ปีกซ้าย / Left Winger": { x: 14, y: 24 },
  "ปีกขวา / Right Winger": { x: 86, y: 24 },
  "หน้าเป้า / Striker": { x: 50, y: 11 },
};

export function PositionPitch({
  primary,
  secondary,
}: {
  primary: string | null;
  secondary: string[];
}) {
  const primaryPos = primary ? POSITION_COORDS[primary.trim()] : null;
  const primaryColor = positionColor(categoryForPosition(primary?.trim()));

  const secondaryPos = secondary
    .map((p) => {
      const coords = POSITION_COORDS[p.trim()];
      if (!coords) return null;
      return { ...coords, color: positionColor(categoryForPosition(p.trim())) };
    })
    .filter((p): p is { x: number; y: number; color: string } => Boolean(p));

  return (
    <svg viewBox="0 0 100 130" className="w-full max-w-56">
      <rect x="2" y="2" width="96" height="126" rx="2" fill="none" stroke="#ffffff30" strokeWidth="1" />
      <line x1="2" y1="65" x2="98" y2="65" stroke="#ffffff20" strokeWidth="1" />
      <circle cx="50" cy="65" r="10" fill="none" stroke="#ffffff20" strokeWidth="1" />
      {/* กรอบเขตโทษ */}
      <rect x="24" y="2" width="52" height="18" fill="none" stroke="#ffffff20" strokeWidth="1" />
      <rect x="24" y="110" width="52" height="18" fill="none" stroke="#ffffff20" strokeWidth="1" />

      {secondaryPos.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="5"
          fill={p.color}
          fillOpacity="0.35"
          stroke={p.color}
          strokeOpacity="0.8"
          strokeWidth="1.5"
        />
      ))}
      {primaryPos && (
        <>
          <circle cx={primaryPos.x} cy={primaryPos.y} r="13" fill={primaryColor} fillOpacity="0.2" />
          <circle cx={primaryPos.x} cy={primaryPos.y} r="8" fill={primaryColor} stroke="#1e1b4b" strokeWidth="2" />
        </>
      )}
    </svg>
  );
}
