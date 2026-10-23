import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { display } from "@/components/fonts";

// ชิ้นส่วนดีไซน์ร่วมของ Talent ID (ธีมเข้ม): หัวหน้า · แถบตัวเลข · กล่องเนื้อหา · กราฟแท่ง — เรียบ ไม่มีไล่สี/วงเบลอ/กล่องไอคอนสี
export { display };

// ลำดับเกรดจริงตาม Airtable (GRADE LEG1 / Leg 2 / Camp 2026 field options)
export const GRADE_ORDER = ["A", "B+", "B", "C+", "C", "D+", "D"];

// สีประจำเกรด: กลุ่ม A/B/C/D คนละสี · เกรดบวกสีอ่อนกว่าเกรดปกติในกลุ่มเดียวกัน (มีตัวอักษรเกรดกำกับทุกที่ ไม่สื่อด้วยสีอย่างเดียว)
export const GRADE_HEX: Record<string, string> = {
  A: "#fbbf24",
  "B+": "#7dd3fc",
  B: "#0ea5e9",
  "C+": "#6ee7b7",
  C: "#10b981",
  "D+": "#c4b5fd",
  D: "#8b5cf6",
};
export const gradeHex = (grade: string) => GRADE_HEX[grade] ?? "#87a4d9";

// เกรด/คะแนนล่าสุดของผู้เล่น (Camp 2026 → Leg 2 → Leg 1)
export function bestGrade(p: { gradeCamp2026: string | null; gradeLeg2: string | null; gradeLeg1: string | null }) {
  return p.gradeCamp2026 ?? p.gradeLeg2 ?? p.gradeLeg1 ?? null;
}
export function bestRating(p: { avgRatingCamp2026: number | null; avgRatingLeg2: number | null; avgRatingLeg1: number | null }) {
  return p.avgRatingCamp2026 ?? p.avgRatingLeg2 ?? p.avgRatingLeg1 ?? null;
}

// "ปีกซ้าย / Left Winger" → { th: "ปีกซ้าย", en: "Left Winger" }
export function splitLabel(value: string) {
  const [th, en] = value.split(" / ").map((s) => s.trim());
  return { th: th || value, en: en ?? null };
}

// image = ภาพพื้นหลังของหัวหน้า (หน้าภาพรวม) — ทับด้วยสีกรมท่าให้อ่านตัวอักษรได้
export function TalentPageHead({
  eyebrow,
  title,
  sub,
  aside,
  image,
}: {
  eyebrow: string;
  title: string;
  sub?: React.ReactNode;
  aside?: React.ReactNode;
  image?: StaticImageData;
}) {
  return (
    <div
      className={`relative mb-8 flex flex-wrap items-end justify-between gap-4 ${image ? "overflow-hidden rounded-xl border border-white/10 px-6 pb-8 pt-20 sm:px-8 sm:pt-28" : "border-b border-white/10 pb-6"}`}
    >
      {image && (
        <>
          <Image src={image} alt="" fill priority placeholder="blur" sizes="(min-width: 1024px) 70rem, 100vw" className="object-cover object-[50%_55%]" />
          <div className="absolute inset-0 bg-indigo-950/70" />
        </>
      )}
      <div className="relative min-w-0">
        <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300">
          <span className="h-px w-8 bg-amber-300/70" />
          {eyebrow}
        </p>
        <h1 className={`${display.className} mt-3 font-semibold leading-tight text-white ${image ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"}`}>{title}</h1>
        {sub && <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${image ? "text-white/80" : "text-indigo-300"}`}>{sub}</p>}
      </div>
      {aside && <div className="relative">{aside}</div>}
    </div>
  );
}

// แถบตัวเลขหลักต่อกันเป็นแผงเดียว · tone = สีตัวเลข (เน้นเฉพาะตัวที่ต้องสังเกต)
export function ScoreStrip({ items, className = "" }: { items: { label: string; value: string; tone?: "amber" | "red" }[]; className?: string }) {
  return (
    <dl className={`grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 ${className}`}>
      {items.map((s) => (
        <div key={s.label} className="flex flex-col-reverse gap-1 bg-[#081528] px-4 py-4 sm:px-5">
          <dt className="text-xs text-indigo-300">{s.label}</dt>
          <dd className={`${display.className} text-3xl font-semibold tabular-nums ${s.tone === "amber" ? "text-amber-300" : s.tone === "red" ? "text-red-300" : "text-white"}`}>
            {s.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// กล่องเนื้อหา: ป้ายภาษาอังกฤษเล็ก + หัวข้อ + ลิงก์มุมขวา (ถ้ามี)
export function Panel({
  eyebrow,
  title,
  action,
  className = "",
  children,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-xl border border-white/10 bg-[#081528] p-5 sm:p-6 ${className}`}>
      <div className="mb-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-400">{eyebrow}</p>}
          <h2 className={`${display.className} mt-0.5 text-lg font-semibold text-white`}>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export type BarRow = { key: string; label: string; sub?: string | null; value: number; color?: string; href?: string };

// กราฟแท่งแนวนอน (ชื่อ + ตัวเลข + % อยู่เหนือแท่ง) · แถวที่มี href กดไปดูรายชื่อที่กรองแล้วได้
export function HBarList({ rows, color = "#fbbf24", unit = "คน", total }: { rows: BarRow[]; color?: string; unit?: string; total?: number }) {
  if (rows.length === 0) return <p className="py-8 text-center text-sm text-indigo-400">ยังไม่มีข้อมูล</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const sum = total ?? rows.reduce((s, r) => s + r.value, 0);
  return (
    <ul className="space-y-1">
      {rows.map((r) => {
        const pct = sum ? Math.round((r.value / sum) * 1000) / 10 : 0;
        const inner = (
          <>
            <span className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-indigo-100">
                {r.label}
                {r.sub && <span className="ml-1.5 text-xs text-indigo-400">{r.sub}</span>}
              </span>
              <span className="flex-none font-semibold tabular-nums text-white">
                {r.value.toLocaleString()} <span className="text-xs font-normal text-indigo-400">{pct}%</span>
              </span>
            </span>
            <span className="mt-1.5 block h-1.5 rounded-full bg-white/8">
              <span className="block h-full rounded-full" style={{ width: `${Math.max(1.5, (r.value / max) * 100)}%`, background: r.color ?? color }} />
            </span>
          </>
        );
        const title = `${r.label}: ${r.value.toLocaleString()} ${unit} (${pct}%)`;
        return (
          <li key={r.key}>
            {r.href ? (
              <Link href={r.href} title={title} className="-mx-2 block rounded-md px-2 py-1.5 transition-colors hover:bg-white/5">
                {inner}
              </Link>
            ) : (
              <span title={title} className="block py-1.5">
                {inner}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
