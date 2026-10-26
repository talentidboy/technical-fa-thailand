import Image from "next/image";
import { isLevel, LEVEL_META } from "@/lib/academy";

const SIZE = {
  sm: { box: "h-11 w-11 rounded-lg", text: "text-sm", px: 44 },
  md: { box: "h-14 w-14 rounded-xl", text: "text-base", px: 56 },
  lg: { box: "h-24 w-24 rounded-2xl sm:h-28 sm:w-28", text: "text-3xl", px: 112 },
};

// คำทั่วไปที่ไม่ใช้เป็นอักษรย่อ (FC / Academy / Football ...)
const SKIP = /^(fc|f\.c\.|academy|football|club|the|youth|soccer|school|u\d+)$/i;

export function monogram(name: string) {
  const words = name.split(/[\s\-_.]+/).filter((w) => w && !SKIP.test(w));
  const pick = (words.length ? words : name.split(/\s+/)).slice(0, 2);
  return pick.map((w) => w[0]).join("").toUpperCase() || "?";
}

// ตราอคาเดมี: โลโก้ที่อคาเดมี/สมาคมฯ อัปโหลด · ยังไม่มีโลโก้ = อักษรย่อบนพื้นสีระดับ
export function AcademyCrest({ name, logoUrl, level, size = "md", className = "" }: { name: string; logoUrl: string | null; level: string | null; size?: keyof typeof SIZE; className?: string }) {
  const s = SIZE[size];
  const hex = isLevel(level) ? LEVEL_META[level].hex : "#64748b";
  if (logoUrl) {
    return (
      <span className={`relative flex flex-none items-center justify-center overflow-hidden bg-white ring-1 ring-black/10 ${s.box} ${className}`}>
        <Image src={logoUrl} alt={`โลโก้ ${name}`} fill sizes={`${s.px}px`} className="object-contain p-1.5" />
      </span>
    );
  }
  return (
    <span aria-hidden className={`flex flex-none items-center justify-center font-bold tracking-wide text-white ${s.box} ${s.text} ${className}`} style={{ background: `linear-gradient(140deg, ${hex}, #0a1630)` }}>
      {monogram(name)}
    </span>
  );
}
