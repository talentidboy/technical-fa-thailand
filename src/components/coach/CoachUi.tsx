import { Montserrat } from "next/font/google";
import { coreProgramSteps } from "@/lib/coach-program";

// ชิ้นส่วนดีไซน์ร่วมของศูนย์อบรมผู้ฝึกสอน (หน้าทางเข้า / หลักสูตร / หน้าโค้ช)
export const display = Montserrat({ weight: ["700", "800", "900"], subsets: ["latin"], display: "swap" });

// สีประจำระดับ (ไล่เฉด) — ใช้ทั้งบันไดเส้นทางใบอนุญาต การ์ดใบอนุญาต และป้ายระดับ
export const LEVEL_TONE: Record<string, { bar: string; text: string; soft: string; card: string }> = {
  G: { bar: "from-slate-300 to-slate-500", text: "text-slate-600", soft: "bg-slate-100 text-slate-700", card: "from-slate-600 via-slate-700 to-slate-900" },
  C: { bar: "from-sky-300 to-sky-600", text: "text-sky-600", soft: "bg-sky-50 text-sky-700", card: "from-sky-500 via-sky-700 to-indigo-900" },
  B: { bar: "from-violet-300 to-violet-600", text: "text-violet-600", soft: "bg-violet-50 text-violet-700", card: "from-violet-500 via-violet-700 to-indigo-950" },
  A: { bar: "from-orange-300 to-orange-600", text: "text-orange-600", soft: "bg-orange-50 text-orange-700", card: "from-orange-500 via-rose-600 to-indigo-950" },
  PRO: { bar: "from-amber-200 to-amber-500", text: "text-amber-600", soft: "bg-amber-50 text-amber-700", card: "from-amber-400 via-amber-600 to-stone-900" },
};
export const levelTone = (level: string | null | undefined) => LEVEL_TONE[level ?? ""] ?? LEVEL_TONE.G;

// หัวข้อ section แบบชิดซ้าย: ลำดับ + ป้ายเล็ก + หัวข้อใหญ่
export function SectionHead({
  no,
  eyebrow,
  title,
  sub,
  action,
  dark = false,
}: {
  no?: string;
  eyebrow: string;
  title: string;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className={`flex items-center gap-2.5 text-xs font-bold tracking-wide ${dark ? "text-amber-300" : "text-amber-600"}`}>
          {no && <span className={`${display.className} ${dark ? "text-white/40" : "text-slate-400"}`}>{no}</span>}
          {no && <span className={`h-px w-6 ${dark ? "bg-amber-300/60" : "bg-amber-500/60"}`} />}
          {eyebrow}
        </p>
        <h2 className={`mt-1.5 text-2xl font-extrabold leading-tight sm:text-3xl ${dark ? "text-white" : "text-slate-900"}`}>{title}</h2>
        {sub && <p className={`mt-1 text-sm ${dark ? "text-white/60" : "text-slate-500"}`}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// บัตรใบอนุญาตดิจิทัล (สไตล์บัตรในวอลเล็ต) — สีตามระดับ
export function LicenceCard({
  level,
  name,
  certificateNo,
  expire,
  statusLabel,
  statusDot,
}: {
  level: string;
  name: string;
  certificateNo: string | null;
  expire: string | null;
  statusLabel: string;
  statusDot: string;
}) {
  const tone = levelTone(level);
  return (
    <div className={`relative aspect-[1.6/1] w-full overflow-hidden rounded-2xl bg-linear-to-br ${tone.card} p-5 text-white shadow-2xl shadow-black/40 ring-1 ring-white/20`}>
      <div aria-hidden className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
      <div aria-hidden className="absolute inset-0 bg-[repeating-linear-gradient(115deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_2px,transparent_2px,transparent_14px)]" />
      <span aria-hidden className={`${display.className} absolute -bottom-8 -right-2 select-none text-[7.5rem] font-black leading-none text-white/12`}>
        {level}
      </span>
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className={`${display.className} text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/75`}>AFC Coaching Licence</p>
          <span className="inline-flex flex-none items-center gap-1.5 rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold">
            <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
            {statusLabel}
          </span>
        </div>
        <p className={`${display.className} mt-1 text-4xl font-black leading-none drop-shadow`}>{level}</p>
        <div className="mt-auto">
          <p className="truncate text-sm font-bold">{name}</p>
          <div className="mt-1 flex items-end justify-between gap-2 text-[11px] text-white/75">
            <span className="truncate font-mono">{certificateNo ?? "—"}</span>
            {expire && <span className="flex-none">หมดอายุ {expire}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// บันได G → C → B → A → PRO (แท่งสูงขึ้นตามระดับ) — highlight = ระดับปัจจุบันของโค้ช (ถ้ามี)
export function PathwayStairs({ current, compact = false }: { current?: string | null; compact?: boolean }) {
  const currentIdx = current ? coreProgramSteps.findIndex((s) => s.level === current) : -1;
  return (
    <ol className={`grid grid-cols-5 items-end ${compact ? "gap-1.5" : "gap-2 sm:gap-3"}`}>
      {coreProgramSteps.map((s, i) => {
        const tone = levelTone(s.level);
        const done = currentIdx >= 0 && i <= currentIdx;
        const dim = currentIdx >= 0 && i > currentIdx;
        return (
          <li key={s.level} className="flex flex-col items-center">
            <span className={`mb-2 text-[10px] font-semibold tabular-nums ${compact ? "hidden" : "text-white/50"}`}>{s.totalHours} ชม.</span>
            <div
              className={`relative flex w-full items-start justify-center overflow-hidden rounded-t-xl bg-linear-to-b ${tone.bar} ${dim ? "opacity-30" : ""} ${
                i === currentIdx ? "ring-2 ring-white" : ""
              }`}
              style={{ height: `${(compact ? 34 : 56) + i * (compact ? 14 : 26)}px` }}
            >
              <div aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-white/35 to-transparent" />
              <span className={`${display.className} relative mt-1.5 font-black text-white drop-shadow ${compact ? "text-xs" : "text-sm sm:text-base"}`}>{s.level}</span>
              {done && !compact && <span className="absolute bottom-1.5 text-[10px] font-bold text-white/90">✓</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
