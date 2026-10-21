import Link from "next/link";
import Image from "next/image";
import { CoursesSection } from "@/components/CoursesSection";
import { LOGO_URL } from "@/lib/brand";
import { coreProgramSteps } from "@/lib/coach-program";
import { display, PathwayStairs } from "@/components/coach/CoachUi";
import { ArrowLeft, ArrowRight, GraduationCap } from "lucide-react";

export default function CoursesPage() {
  const totalHours = coreProgramSteps.reduce((s, c) => s + c.totalHours, 0);
  return (
    <div className="min-h-screen overflow-x-clip bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070b1f]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <Image src={LOGO_URL} alt="FA Thailand" width={36} height={36} className="h-9 w-9 flex-none rounded-lg object-cover ring-1 ring-white/20" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">FA Thailand Technical</p>
              <p className="truncate text-[11px] text-white/50">ศูนย์อบรมผู้ฝึกสอนฟุตบอล</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/coach-center"
              className="hidden items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-sm font-bold text-amber-950 hover:bg-amber-300 sm:inline-flex"
            >
              <GraduationCap className="h-4 w-4" />
              สมัครอบรม
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white/70 ring-1 ring-white/15 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">กลับหน้าแรก</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#070b1f] text-white">
        <div aria-hidden className="absolute -left-40 -top-40 -z-10 h-120 w-120 rounded-full bg-indigo-600/40 blur-[120px]" />
        <div aria-hidden className="absolute -right-32 bottom-0 -z-10 h-104 w-104 rounded-full bg-amber-400/15 blur-[120px]" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[56px_56px] mask-[radial-gradient(ellipse_at_center,black_20%,transparent_75%)]"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 ring-1 ring-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24]" />
              มาตรฐานสมาพันธ์ฟุตบอลเอเชีย (AFC)
            </span>
            <h1 className={`${display.className} mt-6 text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl`}>
              <span className="block">COACHING</span>
              <span className="block bg-linear-to-r from-amber-200 via-amber-300 to-amber-500 bg-clip-text text-transparent">COURSES</span>
            </h1>
            <p className="mt-5 text-2xl font-extrabold">หลักสูตรอบรมผู้ฝึกสอน</p>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/60">
              สมาคมกีฬาฟุตบอลแห่งประเทศไทยฯ ให้ความสำคัญกับการพัฒนาบุคลากรด้านการฝึกสอน เพราะผู้ฝึกสอนคือผู้วางรากฐานให้กับฟุตบอลไทย ตั้งแต่ระดับพื้นฐานจนถึงระดับอาชีพ —
              อ้างอิงจาก{" "}
              <a href="https://fathailand.org/coaching-education?language=th" target="_blank" rel="noopener noreferrer" className="font-semibold text-amber-300 hover:underline">
                fathailand.org
              </a>
            </p>
            <Link
              href="/coach-center"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-amber-950 hover:bg-amber-300"
            >
              ดูรุ่นที่เปิดรับสมัคร
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur sm:p-7">
            <PathwayStairs />
            <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-center">
              {[
                { v: "3", l: "สายหลักสูตร" },
                { v: "5", l: "ระดับ Core Program" },
                { v: totalHours.toLocaleString(), l: "ชั่วโมงรวม G → PRO" },
              ].map((s) => (
                <div key={s.l}>
                  <dd className={`${display.className} text-2xl font-black text-amber-300`}>{s.v}</dd>
                  <dt className="mt-0.5 text-[11px] text-white/50">{s.l}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <CoursesSection />
    </div>
  );
}
