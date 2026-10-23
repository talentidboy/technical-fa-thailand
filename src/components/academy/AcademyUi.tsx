import { Award, CircleHelp } from "lucide-react";
import { isLevel, tierLabel, LEVEL_META, STATE_META, type AcademyState } from "@/lib/academy";

// เหรียญระดับ Bronze / Silver / Gold (ยังไม่ระบุระดับ = วงประ)
export function LevelMedal({ level, size = "md" }: { level: string | null; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "h-20 w-20" : size === "sm" ? "h-9 w-9" : "h-12 w-12";
  const icon = size === "lg" ? "h-10 w-10" : size === "sm" ? "h-4.5 w-4.5" : "h-6 w-6";
  if (!isLevel(level)) {
    return (
      <span className={`flex flex-none items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-white text-slate-400 ${box}`}>
        <CircleHelp className={icon} />
      </span>
    );
  }
  return (
    <span className={`relative flex flex-none items-center justify-center rounded-full bg-linear-to-br shadow-md ring-2 ring-white ${LEVEL_META[level].medal} ${box}`}>
      <span className="absolute inset-1 rounded-full bg-linear-to-tl from-white/0 to-white/50" />
      <Award className={`relative text-white drop-shadow ${icon}`} />
    </span>
  );
}

// เครื่องหมายระดับแบบเรียบ (หน้าสาธารณะ): สี่เหลี่ยมสีระดับ + ชื่อระดับตัวพิมพ์ใหญ่
export function LevelMark({ level, className = "" }: { level: string | null; className?: string }) {
  const meta = isLevel(level) ? LEVEL_META[level] : null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 ${meta ? "uppercase tracking-[0.12em]" : ""} ${className}`}>
      <span className="h-2.5 w-2.5 flex-none rounded-xs" style={{ background: meta?.hex ?? "#cbd5e1" }} />
      {meta?.label ?? "รอระดับ"}
    </span>
  );
}

export function LevelBadge({ level, tier }: { level: string | null; tier?: string | null }) {
  if (!isLevel(level)) return <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">ยังไม่ระบุระดับ</span>;
  const meta = LEVEL_META[level];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${meta.badge}`}>
      {meta.label}
      {tier && <span className="font-semibold opacity-70">· {tierLabel(tier)}</span>}
    </span>
  );
}

export function StateChip({ state }: { state: AcademyState }) {
  const meta = STATE_META[state];
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${meta.tone}`}>{meta.label}</span>;
}
