import Link from "next/link";
import { CoursesSection } from "@/components/CoursesSection";
import { ModuleHeader } from "@/components/ModuleHeader";
import { coreProgramSteps } from "@/lib/coach-program";
import { display, PathwayStairs } from "@/components/coach/CoachUi";
import { ArrowRight, GraduationCap } from "lucide-react";

export default function CoursesPage() {
  const totalHours = coreProgramSteps.reduce((s, c) => s + c.totalHours, 0);
  return (
    <div className="min-h-screen overflow-x-clip bg-white">
      <ModuleHeader
        title="หลักสูตรอบรมผู้ฝึกสอน"
        subtitle="ศูนย์อบรมผู้ฝึกสอนฟุตบอล"
        links={[
          { href: "/coach-center", label: "ศูนย์อบรมผู้ฝึกสอน" },
          { href: "#courses", label: "AFC Core Program" },
        ]}
        actions={
          <Link
            href="/coach-center"
            className="hidden items-center gap-1.5 rounded-full bg-[#073c5e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a4a73] sm:inline-flex"
          >
            <GraduationCap className="h-4 w-4" />
            สมัครอบรม
          </Link>
        }
      />

      {/* Hero */}
      <section className="border-b border-slate-200 bg-[#f5f4f0]">
        <div className="mx-auto grid max-w-6xl items-end gap-10 px-5 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div>
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700">
              <span className="h-px w-10 bg-amber-600" />
              Coaching Courses · AFC
            </p>
            <h1 className={`${display.className} mt-6 text-5xl font-semibold leading-[1.05] text-[#073c5e] sm:text-6xl`}>
              หลักสูตรอบรม
              <br />
              ผู้ฝึกสอน
            </h1>
            <p className="mt-3 text-lg font-semibold text-slate-800">มาตรฐานสมาพันธ์ฟุตบอลเอเชีย (AFC)</p>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-600">
              สมาคมกีฬาฟุตบอลแห่งประเทศไทยฯ ให้ความสำคัญกับการพัฒนาบุคลากรด้านการฝึกสอน เพราะผู้ฝึกสอนคือผู้วางรากฐานให้กับฟุตบอลไทย ตั้งแต่ระดับพื้นฐานจนถึงระดับอาชีพ —
              อ้างอิงจาก{" "}
              <a href="https://fathailand.org/coaching-education?language=th" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#073c5e] underline-offset-2 hover:underline">
                fathailand.org
              </a>
            </p>
            <Link
              href="/coach-center"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-[#073c5e] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#0a4a73]"
            >
              ดูรุ่นที่เปิดรับสมัคร
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="rounded-xl bg-[#04223a] p-6 text-white sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">AFC Core Program</p>
            <div className="mt-5">
              <PathwayStairs />
            </div>
            <dl className="mt-6 grid grid-cols-3 border-t border-white/15 pt-5">
              {[
                { v: "3", l: "สายหลักสูตร" },
                { v: "5", l: "ระดับ Core Program" },
                { v: totalHours.toLocaleString(), l: "ชั่วโมงรวม G → PRO" },
              ].map((s, i) => (
                <div key={s.l} className={`flex flex-col-reverse ${i ? "border-l border-white/15 pl-4" : ""}`}>
                  <dt className="mt-0.5 text-[11px] text-white/55">{s.l}</dt>
                  <dd className={`${display.className} text-3xl font-semibold text-white`}>{s.v}</dd>
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
