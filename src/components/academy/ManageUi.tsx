import Link from "next/link";
import { ChevronRight } from "lucide-react";

// ส่วนประกอบมาตรฐานของหน้าจัดการ Academy Licensing — ทุกหน้าใช้หัวเรื่อง / การ์ด / ปุ่มแบบเดียวกัน

export const btn = {
  primary: "inline-flex items-center justify-center gap-1.5 rounded-md bg-[#0b1f44] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d5c] disabled:opacity-50",
  secondary: "inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50",
  danger: "inline-flex items-center justify-center gap-1.5 rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50",
  dangerSolid: "inline-flex items-center justify-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700",
  link: "font-semibold text-[#0b1f44] underline decoration-slate-300 underline-offset-4 hover:decoration-[#0b1f44]",
};

export const input =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0b1f44] focus:outline-none focus:ring-2 focus:ring-[#0b1f44]/10";

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
          <nav aria-label="ตำแหน่งหน้า" className="mb-1.5 flex flex-wrap items-center gap-1 text-xs text-slate-500">
            {crumbs.map((c) => (
              <span key={c.href} className="inline-flex items-center gap-1">
                <Link href={c.href} className="hover:text-slate-900 hover:underline">
                  {c.label}
                </Link>
                <ChevronRight className="h-3 w-3" />
              </span>
            ))}
          </nav>
        )}
        <div className={`flex flex-wrap items-start justify-between gap-3 ${children ? "pb-4" : "pb-5"}`}>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            {description && <div className="mt-0.5 text-sm text-slate-500">{description}</div>}
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

export function Card({ title, actions, children, className = "", flush = false }: { title?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-3">
          {title && <h2 className="text-sm font-semibold text-slate-900">{title}</h2>}
          {actions}
        </div>
      )}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

// แท็บแบบลิงก์ (เปลี่ยนหน้า) ใต้หัวเรื่อง
export function TabLinks({ tabs, active }: { tabs: { key: string; href: string; label: string; count?: number; alert?: boolean }[]; active: string }) {
  return (
    <nav aria-label="แท็บ" className="-mb-px flex gap-1 overflow-x-auto">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={active === t.key ? "page" : undefined}
          className={`inline-flex flex-none items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium ${
            active === t.key ? "border-[#0b1f44] text-slate-900" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={`rounded-full px-1.5 text-[11px] font-semibold ${t.alert ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{t.count}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

// ช่องว่างเมื่อไม่มีข้อมูล
export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-10 text-center text-sm text-slate-400">{children}</p>;
}
