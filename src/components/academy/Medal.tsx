import { isLevel, type AcademyLevel } from "@/lib/academy";
import { academySerif } from "@/components/typefaces/academy";

// สีเหรียญแต่ละระดับ: หน้าเหรียญ · วงขอบใน · ริบบิ้น
export const MEDAL: Record<AcademyLevel, { face: string; ring: string; ribbon: string; letter: string }> = {
  BRONZE: { face: "#b8733a", ring: "#e3aa72", ribbon: "#7c3f16", letter: "B" },
  SILVER: { face: "#98a3b2", ring: "#e1e6ec", ribbon: "#4b5563", letter: "S" },
  GOLD: { face: "#c9a227", ring: "#f3d97c", ribbon: "#8a6a10", letter: "G" },
};

const SIZE = {
  sm: { disc: "h-10 w-10", letter: "text-base", ribbon: "h-4 w-2.5", ribbonTop: "top-7", gap: "gap-0.5" },
  md: { disc: "h-16 w-16", letter: "text-2xl", ribbon: "h-7 w-4", ribbonTop: "top-11", gap: "gap-1" },
  lg: { disc: "h-28 w-28", letter: "text-5xl", ribbon: "h-12 w-7", ribbonTop: "top-20", gap: "gap-1.5" },
};

// เหรียญประจำระดับ (ทองแดง / เงิน / ทอง) วาดด้วย CSS: หน้าเหรียญ + วงใน + อักษรย่อ + ริบบิ้นสองหาง · ยังไม่มีระดับ = วงเทา
export function Medal({ level, size = "md", className = "" }: { level: string | null; size?: keyof typeof SIZE; className?: string }) {
  const s = SIZE[size];
  const m = isLevel(level) ? MEDAL[level] : null;
  return (
    <span aria-hidden className={`relative inline-flex flex-none flex-col items-center ${className}`}>
      {m && (
        <span className={`absolute ${s.ribbonTop} flex ${s.gap}`}>
          <span className={`${s.ribbon} -rotate-12`} style={{ background: m.ribbon, clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)" }} />
          <span className={`${s.ribbon} rotate-12`} style={{ background: m.ribbon, clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)" }} />
        </span>
      )}
      <span
        className={`relative flex ${s.disc} items-center justify-center rounded-full shadow-[inset_0_-4px_0_rgb(0_0_0/0.18)]`}
        style={{ background: m?.face ?? "#cbd5e1" }}
      >
        <span className="flex h-[78%] w-[78%] items-center justify-center rounded-full border-2" style={{ borderColor: m?.ring ?? "#e2e8f0" }}>
          <span className={`${academySerif.className} ${s.letter} font-bold leading-none text-white`}>{m?.letter ?? "–"}</span>
        </span>
      </span>
    </span>
  );
}
