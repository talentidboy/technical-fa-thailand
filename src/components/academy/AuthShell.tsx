import { BrandLogo } from "@/components/BrandLogo";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AcademyLogo } from "@/components/SectionLogos";
import { HomeButton } from "@/components/HomeButton";
import { academyFont } from "@/components/typefaces/academy";
import { academyBg } from "@/lib/section-images";

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
      <aside className="relative isolate overflow-hidden bg-[#071530] px-6 pb-8 pt-6 text-white sm:px-10 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between lg:py-10">
        <Image src={academyBg} alt="" fill priority placeholder="blur" sizes="(min-width: 1024px) 50vw, 100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-[#071530]/85" />
        <div className="absolute inset-x-0 top-0 h-1 bg-[#d9b45a]" />

        <div className="flex items-center justify-between gap-3">
          <Link href="/academies" className="flex w-fit items-center gap-3">
            <BrandLogo tone="white" className="h-10" />
            <span className="h-8 w-px bg-white/25" />
            <AcademyLogo className="h-10" />
          </Link>
          {/* จอเล็ก: แผงซ้ายเป็นแถบบน ปุ่มกลับหน้าแรกอยู่มุมขวาของแถบนี้ */}
          <div className="flex-none lg:hidden">
            <HomeButton tone="dark" />
          </div>
        </div>

        <div className="mt-8 max-w-md lg:mt-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#d9b45a]">{eyebrow}</p>
          <h1 className={`${academyFont.className} mt-3 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl`}>{title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">{intro}</p>
          <ol className="mt-9 hidden space-y-5 border-t border-white/15 pt-6 sm:block">
            {points.map(({ title: t, desc }, i) => (
              <li key={t} className="flex gap-4">
                <span className={`${academyFont.className} w-7 flex-none text-xl font-bold text-[#d9b45a]`}>{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span className="block text-sm font-semibold">{t}</span>
                  <span className="block text-xs text-white/60">{desc}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p className="hidden text-xs text-white/45 lg:block">ฝ่ายเทคนิค สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์</p>
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
