import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CoachCentreLogo } from "@/components/SectionLogos";
import { HomeButton } from "@/components/HomeButton";
import { display } from "@/components/fonts";

// แถบบนของศูนย์อบรมผู้ฝึกสอน (กรมท่าเข้ม + ทอง) — ใช้ร่วมหน้า /coach-center และ /courses · ปุ่มกลับหน้าแรกอยู่มุมขวาสุดเหมือนทุกหมวด
export function CoachHeader({ links = [], cta }: { links?: { href: string; label: string }[]; cta?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#031a2c] text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/coach-center" className="flex min-w-0 items-center gap-3">
          <BrandLogo tone="white" className="h-9" />
          <span className="h-7 w-px flex-none bg-white/20" />
          <CoachCentreLogo tone="white" className="hidden h-5 sm:block" />
          <span className="min-w-0 leading-tight">
            <span className={`${display.className} block truncate text-[15px] font-semibold`}>ศูนย์อบรมผู้ฝึกสอนฟุตบอล</span>
            <span className="block truncate text-[11px] text-white/50">Coach Education · FA Thailand</span>
          </span>
        </Link>
        {links.length > 0 && (
          <nav aria-label="เมนูศูนย์อบรม" className="hidden flex-1 items-center justify-center gap-7 text-sm font-medium text-white/70 lg:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="transition-colors hover:text-[#e3bb63]">
                {l.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="ml-auto flex flex-none items-center gap-2">
          {cta}
          <HomeButton tone="dark" />
        </div>
      </div>
    </header>
  );
}
