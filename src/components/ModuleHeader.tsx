import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { display } from "@/components/fonts";
import { ArrowLeft } from "lucide-react";

// หัวเว็บของหน้าหมวดงาน (ศูนย์อบรมผู้ฝึกสอน / Grassroots / Training Centre ฯลฯ) — แถบขาว โลโก้น้ำเงิน + โลโก้หมวด (ถ้ามี) + ชื่อหมวด + เส้นสีประจำหมวดด้านบน
export function ModuleHeader({
  title,
  subtitle,
  accent = "#073c5e",
  links = [],
  actions,
  logo,
}: {
  title: string;
  subtitle?: string;
  accent?: string;
  links?: { href: string; label: string }[];
  actions?: React.ReactNode;
  logo?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="h-0.75" style={{ background: accent }} />
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-5 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="FA Thailand Technical — หน้าแรก">
          <BrandLogo tone="navy" className="h-9" />
          <span className="h-7 w-px flex-none bg-slate-200" />
          {logo && <span className="hidden flex-none sm:block">{logo}</span>}
          <span className="min-w-0 leading-tight">
            <span className={`${display.className} block truncate text-base font-semibold text-[#073c5e]`}>{title}</span>
            {subtitle && <span className="block truncate text-[11px] text-slate-500">{subtitle}</span>}
          </span>
        </Link>
        {links.length > 0 && (
          <nav aria-label="เมนูหมวด" className="hidden flex-1 items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-[#073c5e]">
                {l.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="ml-auto flex flex-none items-center gap-2">
          {actions}
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">หน้าแรก</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
