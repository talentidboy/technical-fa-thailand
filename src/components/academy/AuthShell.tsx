import { BrandLogo } from "@/components/BrandLogo";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AcademyLogo } from "@/components/SectionLogos";
import { HomeButton } from "@/components/HomeButton";
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
    <div className={`min-h-screen bg-white lg:grid ${wide ? "lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]" : "lg:grid-cols-2"}`}>
      <aside className="relative isolate overflow-hidden bg-indigo-950 px-6 pb-8 pt-6 text-white sm:px-10 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between lg:py-10">
        <Image src={academyBg} alt="" fill priority placeholder="blur" sizes="(min-width: 1024px) 50vw, 100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-indigo-950/85" />
        <div className="absolute inset-x-0 top-0 h-1 bg-amber-400" />

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
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-indigo-200 sm:text-base">{intro}</p>
          <ul className="mt-8 hidden space-y-4 sm:block">
            {points.map(({ icon: Icon, title: t, desc }) => (
              <li key={t} className="flex gap-3.5">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-white/8 text-amber-300 ring-1 ring-white/10">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{t}</span>
                  <span className="block text-xs text-indigo-300">{desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="hidden text-xs text-indigo-400 lg:block">ฝ่ายเทคนิค สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์</p>
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
