import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

// ส่วนประกอบมาตรฐานของหน้าจัดการ Academy Licensing — ทุกหน้าใช้หัวเรื่อง / การ์ด / ปุ่มแบบเดียวกัน
// โทนเดียวกับหน้าสาธารณะ (ฟ้า #1e96dc · ดำ #0b1220 · เหลือง #ffd426) · การ์ดมีแถบสีบนบอกประเภทเนื้อหา

export const btn = {
  primary: "inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1e96dc] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0b6cb0] disabled:opacity-50",
  secondary: "inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition-colors hover:bg-[#e6f3fc] hover:ring-[#9fd0f0]",
  danger: "inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-red-600 ring-1 ring-red-200 transition-colors hover:bg-red-50",
  dangerSolid: "inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700",
  link: "font-semibold text-[#0b6cb0] underline decoration-[#1e96dc]/40 underline-offset-4 hover:decoration-[#0b6cb0]",
};

export const input =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1e96dc] focus:outline-none focus:ring-3 focus:ring-[#1e96dc]/15";

// สีของการ์ด (แถบบน + ไอคอนหัวการ์ด)
export const TONES = {
  sky: { bar: "border-t-[#1e96dc]", icon: "text-[#1e96dc]" },
  amber: { bar: "border-t-amber-400", icon: "text-amber-500" },
  red: { bar: "border-t-red-500", icon: "text-red-500" },
  violet: { bar: "border-t-violet-500", icon: "text-violet-500" },
  emerald: { bar: "border-t-emerald-500", icon: "text-emerald-600" },
  orange: { bar: "border-t-orange-500", icon: "text-orange-500" },
  ink: { bar: "border-t-[#0b1220]", icon: "text-[#0b1220]" },
} as const;
export type Tone = keyof typeof TONES;

export function PageHeader({
  title,
  description,
  crumbs,
  actions,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  crumbs?: { href: string; label: string }[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-8">
        {crumbs && (
          <nav aria-label="ตำแหน่งหน้า" className="mb-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
            {crumbs.map((c) => (
              <span key={c.href} className="inline-flex items-center gap-1">
                <Link href={c.href} className="font-medium text-[#0b6cb0] hover:underline">
                  {c.label}
                </Link>
                <ChevronRight className="h-3 w-3" />
              </span>
            ))}
          </nav>
        )}
        <div className={`flex flex-wrap items-start justify-between gap-3 ${children ? "pb-4" : "pb-5"}`}>
          <div className="flex min-w-0 gap-3">
            <span aria-hidden className="mt-1 h-7 w-1.5 flex-none rounded-full bg-[#1e96dc]" />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-[#0b1220]">{title}</h1>
              {description && <div className="mt-0.5 text-sm text-slate-500">{description}</div>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageBody({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-8">{children}</main>;
}

export function Card({
  title,
  actions,
  children,
  className = "",
  flush = false,
  tone = "sky",
  icon: Icon,
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
  tone?: Tone;
  icon?: LucideIcon;
}) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-t-4 border-slate-200 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04)] ${TONES[tone].bar} ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
          {title && (
            <h2 className="flex items-center gap-2 text-[15px] font-bold text-[#0b1220]">
              {Icon && <Icon className={`h-4.5 w-4.5 flex-none ${TONES[tone].icon}`} />}
              {title}
            </h2>
          )}
          {actions}
        </div>
      )}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

// แท็บแบบลิงก์ (เปลี่ยนหน้า) ใต้หัวเรื่อง: ปุ่มเม็ดยา · แท็บที่เปิดอยู่เป็นสีดำ · ตัวเลขงานรอเป็นสีเหลือง
export function TabLinks({ tabs, active }: { tabs: { key: string; href: string; label: string; count?: number; alert?: boolean }[]; active: string }) {
  return (
    <nav aria-label="แท็บ" className="flex gap-1.5 overflow-x-auto pb-3 [scrollbar-width:none]">
      {tabs.map((t) => {
        const on = active === t.key;
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={`inline-flex flex-none items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${on ? "bg-[#0b1220] text-white" : "text-slate-600 hover:bg-[#e6f3fc] hover:text-[#0b6cb0]"}`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`rounded-full px-1.5 text-[11px] font-bold ${t.alert ? "bg-[#ffd426] text-[#0b1220]" : on ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>{t.count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// ช่องว่างเมื่อไม่มีข้อมูล
export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-10 text-center text-sm text-slate-400">{children}</p>;
}
