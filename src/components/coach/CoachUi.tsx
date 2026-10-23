import { display } from "@/components/fonts";

// ชิ้นส่วนดีไซน์ร่วมของศูนย์อบรมผู้ฝึกสอน (หน้าทางเข้า / หลักสูตร / หน้าโค้ช)
// ตัวหัวข้อใช้ Kanit ตัวเดียวกับทั้งเว็บ
export { display };

// สีประจำระดับใบอนุญาต (สีทึบ ไม่ไล่เฉด) — ใช้ทั้งเส้นทางใบอนุญาต การ์ดใบอนุญาต และป้ายระดับ
// hex = ใช้กับ style โดยตรง · bar = พื้นแถบ · card = พื้นการ์ด · text / soft = ตัวอักษร / ป้ายอ่อน
export const LEVEL_TONE: Record<string, { hex: string; bar: string; text: string; soft: string; card: string }> = {
  G: { hex: "#64748b", bar: "bg-slate-500", text: "text-slate-600", soft: "bg-slate-100 text-slate-700", card: "bg-slate-700" },
  C: { hex: "#0369a1", bar: "bg-sky-700", text: "text-sky-700", soft: "bg-sky-50 text-sky-800", card: "bg-sky-800" },
  B: { hex: "#6d28d9", bar: "bg-violet-700", text: "text-violet-700", soft: "bg-violet-50 text-violet-800", card: "bg-violet-800" },
  A: { hex: "#c2410c", bar: "bg-orange-700", text: "text-orange-700", soft: "bg-orange-50 text-orange-800", card: "bg-orange-800" },
  PRO: { hex: "#a16207", bar: "bg-yellow-700", text: "text-yellow-700", soft: "bg-yellow-50 text-yellow-800", card: "bg-[#6b4a0c]" },
};
export const levelTone = (level: string | null | undefined) => LEVEL_TONE[level ?? ""] ?? LEVEL_TONE.G;

// หัวข้อ section แบบชิดซ้าย: ป้ายภาษาอังกฤษเล็ก + หัวข้อใหญ่ (no = ลำดับ ใส่หรือไม่ก็ได้)
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
        <p className={`flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.24em] ${dark ? "text-amber-300" : "text-amber-700"}`}>
          {no && <span className={`${display.className} tracking-normal ${dark ? "text-white/40" : "text-slate-400"}`}>{no}</span>}
          {no && <span className={`h-px w-6 ${dark ? "bg-amber-300/60" : "bg-amber-600/50"}`} />}
          {eyebrow}
        </p>
        <h2 className={`${display.className} mt-2 text-3xl font-semibold leading-tight sm:text-4xl ${dark ? "text-white" : "text-[#073c5e]"}`}>{title}</h2>
        {sub && <p className={`mt-1.5 text-sm ${dark ? "text-white/60" : "text-slate-500"}`}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// บัตรใบอนุญาตดิจิทัล — พื้นสีทึบตามระดับ ตัวอักษรระดับขนาดใหญ่เป็นลายพื้น
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
    <div className={`relative aspect-[1.6/1] w-full overflow-hidden rounded-xl p-5 text-white shadow-xl shadow-black/25 ${tone.card}`}>
      <span aria-hidden className={`${display.className} absolute -bottom-10 -right-2 select-none text-[8.5rem] font-semibold leading-none text-white/10`}>
        {level}
      </span>
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">AFC Coaching Licence</p>
          <span className="inline-flex flex-none items-center gap-1.5 rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold">
            <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
            {statusLabel}
          </span>
        </div>
        <p className={`${display.className} mt-1 text-4xl font-semibold leading-none`}>{level}</p>
        <div className="mt-auto border-t border-white/20 pt-3">
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
