import { BrandLogo } from "@/components/BrandLogo";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AcademyLogo } from "@/components/SectionLogos";
import { HomeButton } from "@/components/HomeButton";
import { academyFont, academyPoster } from "@/components/typefaces/academy";

// โครงหน้าเข้าสู่ระบบ / สมัครของ Academy Licensing: ซ้ายแผงภาพกิจกรรม Academy Visit ทับสีกรมท่า · ขวาฟอร์ม (มือถือ: แผงซ้ายย่อเป็นแถบบน)
export function AuthShell({
  eyebrow,
  title,
  intro,
  points,
  wide = false,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  points: { icon: LucideIcon; title: string; desc: string }[];
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`${academyFont.className} min-h-screen bg-white lg:grid ${wide ? "lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]" : "lg:grid-cols-2"}`}>
      <aside className="relative isolate overflow-hidden bg-[#1e96dc] px-6 pb-8 pt-6 text-[#0b1220] sm:px-10 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between lg:py-10">
        {/* วงกลมตกแต่งแบบโปสเตอร์ */}
        <span aria-hidden className="absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full bg-white/15" />
        <span aria-hidden className="absolute -bottom-12 -left-12 -z-10 h-48 w-48 rounded-full border-2 border-dashed border-white/50" />

        <div className="flex items-center justify-between gap-3">
          <Link href="/academies" className="flex w-fit items-center gap-3">
            <BrandLogo tone="navy" className="h-10" />
            <span className="h-8 w-px bg-[#0b1220]/20" />
            <AcademyLogo className="h-10" />
          </Link>
          {/* จอเล็ก: แผงซ้ายเป็นแถบบน ปุ่มกลับหน้าแรกอยู่มุมขวาของแถบนี้ */}
          <div className="flex-none lg:hidden">
            <HomeButton />
          </div>
        </div>

        <div className="mt-8 max-w-md lg:mt-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[#0b1220]">{eyebrow}</p>
          <h1 className={`${academyPoster.className} mt-3 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl`}>{title}</h1>
          <p className="mt-4 text-sm font-medium leading-relaxed text-[#0b1220]/80 sm:text-base">{intro}</p>
          <ol className="mt-9 hidden space-y-3 sm:block">
            {points.map(({ title: t, desc }, i) => (
              <li key={t} className="flex items-center gap-4 rounded-2xl bg-white/90 p-3">
                <span className={`${academyPoster.className} flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#ffd426] text-lg font-extrabold text-[#0b1220]`}>{i + 1}</span>
                <span>
                  <span className="block text-sm font-semibold">{t}</span>
                  <span className="block text-xs text-[#0b1220]/65">{desc}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p className="hidden text-xs font-medium text-[#0b1220]/60 lg:block">ฝ่ายเทคนิค สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์</p>
      </aside>

      <main className="relative flex items-center justify-center px-5 py-10 sm:px-10 lg:py-16">
        <div className="absolute right-4 top-4 hidden lg:block">
          <HomeButton />
        </div>
        <div className={`w-full ${wide ? "max-w-2xl" : "max-w-sm"}`}>{children}</div>
      </main>
    </div>
  );
}
