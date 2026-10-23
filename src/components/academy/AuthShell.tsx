import { BrandLogo } from "@/components/BrandLogo";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ThailandSilhouette } from "./ThailandSilhouette";

// โครงหน้าเข้าสู่ระบบ / สมัครของ Academy Licensing: ซ้ายแผงสีเข้มพร้อมแผนที่ · ขวาฟอร์ม (มือถือ: แผงสีเข้มย่อเป็นแถบบน)
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
        <div className="absolute -left-32 -top-32 -z-10 h-96 w-96 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute -bottom-40 right-0 -z-10 h-112 w-md rounded-full bg-amber-400/15 blur-3xl" />
        <div
          className="absolute inset-0 -z-10 opacity-[0.05]"
          style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "36px 36px" }}
        />
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-600 via-amber-300 to-amber-600" />
        <ThailandSilhouette className="pointer-events-none absolute left-[42%] top-1/2 -z-10 hidden h-[108%] -translate-y-1/2 opacity-70 lg:block" />

        <Link href="/academies" className="flex w-fit items-center gap-2.5">
          <BrandLogo tone="white" className="h-10" />
          <span>
            <span className="block text-sm font-bold">Academy Licensing</span>
            <span className="block text-[11px] text-indigo-300">สมาคมกีฬาฟุตบอลแห่งประเทศไทยฯ</span>
          </span>
        </Link>

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

      <main className="flex items-center justify-center px-5 py-10 sm:px-10 lg:py-16">
        <div className={`w-full ${wide ? "max-w-2xl" : "max-w-sm"}`}>{children}</div>
      </main>
    </div>
  );
}
