import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { HomeButton } from "@/components/HomeButton";
import { DataCentreLogo } from "@/components/SectionLogos";
import { trainingFont } from "@/components/typefaces/training";

// แถบบนของ Technical Data & Articles Centre (ศูนย์ข้อมูลและบทความด้านเทคนิค) — ปุ่มกลับหน้าแรกอยู่มุมขวาสุดเหมือนทุกหมวด
export function TrainingHeader({ links = [], actions }: { links?: { href: string; label: string }[]; actions?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/training-centre" className="flex min-w-0 items-center gap-3">
          <BrandLogo tone="navy" className="h-9" />
          <span className="h-7 w-px flex-none bg-slate-200" />
          <DataCentreLogo className="hidden h-9 sm:block" />
          <span className="min-w-0 leading-tight">
            <span className={`${trainingFont.className} block truncate text-[15px] font-bold text-slate-900`}>Technical Data & Articles Centre</span>
            <span className="block truncate text-[11px] text-slate-500">ศูนย์ข้อมูลและบทความด้านเทคนิค</span>
          </span>
        </Link>
        {links.length > 0 && (
          <nav aria-label="เมนูศูนย์ข้อมูลและบทความ" className={`${trainingFont.className} hidden flex-1 items-center justify-center gap-7 text-sm font-medium text-slate-600 md:flex`}>
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-[#1d4ed8]">
                {l.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="ml-auto flex flex-none items-center gap-2">
          {actions}
          <HomeButton />
        </div>
      </div>
    </header>
  );
}
