import type { AcademyLevel } from "@/lib/academy";
import { COIN } from "@/components/academy/Podium";
import { academyPoster } from "@/components/typefaces/academy";

// ส่วนประกอบของพอร์ทัลอคาเดมี — โทนเดียวกับหน้าสาธารณะ (ฟ้า #1e96dc · ดำ #0b1220 · เหลือง #ffd426)
// การ์ด / ปุ่ม / ช่องกรอก ใช้ชุดเดียวกับหน้าจัดการ (ManageUi)

// เหรียญระดับแบบเดียวกับแท่นในหน้าหลัก — ยังไม่มีระดับ = เหรียญเทา
export function Coin({ level, className = "" }: { level: AcademyLevel | null; className?: string }) {
  const c = level ? COIN[level] : { face: "#e2e8f0", side: "#94a3b8", ring: "#ffffff", ink: "#475569", letter: "–" };
  return (
    <svg viewBox="0 0 100 70" aria-hidden className={className}>
      <ellipse cx="50" cy="44" rx="44" ry="22" fill={c.side} />
      <rect x="6" y="30" width="88" height="14" fill={c.side} />
      <ellipse cx="50" cy="30" rx="44" ry="22" fill={c.face} />
      <ellipse cx="50" cy="30" rx="33" ry="16" fill="none" stroke={c.ring} strokeWidth="2.5" />
      <text x="50" y="38" textAnchor="middle" fontSize="22" fontWeight="800" fill={c.ink}>
        {c.letter}
      </text>
    </svg>
  );
}

// สีตัวอักษรชื่อระดับบนพื้นขาว
export const LEVEL_TEXT: Record<AcademyLevel, string> = { BRONZE: "#c14d14", SILVER: "#5b6b80", GOLD: "#a77700" };

// หัวเรื่องของแต่ละหน้าในพอร์ทัล: แถบฟ้า + ชื่อหน้าแบบโปสเตอร์ + คำอธิบายสั้น
export function PortalTitle({ title, description, actions }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex min-w-0 gap-3">
        <span aria-hidden className="mt-1.5 h-8 w-1.5 flex-none rounded-full bg-[#1e96dc]" />
        <div className="min-w-0">
          <h1 className={`${academyPoster.className} text-2xl font-bold text-[#0b1220] sm:text-3xl`}>{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// แถบความคืบหน้า (ฟ้า · ครบ = เขียว)
export function Progress({ value, max, className = "" }: { value: number; max: number; className?: string }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`h-2.5 overflow-hidden rounded-full bg-slate-100 ${className}`}>
      <div className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : "bg-[#1e96dc]"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
