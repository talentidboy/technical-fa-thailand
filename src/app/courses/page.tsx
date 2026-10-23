import Link from "next/link";
import { CoursesSection } from "@/components/CoursesSection";
import { CoachHeader } from "@/components/coach/CoachHeader";
import { LicenceFan } from "@/components/coach/LicenceFan";
import { coreProgramSteps } from "@/lib/coach-program";
import { display } from "@/components/coach/CoachUi";
import { ArrowRight, GraduationCap } from "lucide-react";

const GOLD = "#e3bb63";

export default function CoursesPage() {
  const totalHours = coreProgramSteps.reduce((s, c) => s + c.totalHours, 0);
  return (
    <div className="min-h-screen overflow-x-clip bg-[#f6f4ef]">
      <CoachHeader
        links={[
          { href: "/coach-center", label: "ศูนย์อบรมผู้ฝึกสอน" },
          { href: "#courses", label: "AFC Core Program" },
          { href: "#specialist", label: "หลักสูตรเฉพาะทาง" },
        ]}
        cta={
          <Link href="/coach-center#open" className="hidden h-10 items-center gap-1.5 rounded-lg bg-[#e3bb63] px-4 text-sm font-semibold text-[#031a2c] hover:bg-[#ecc97b] sm:inline-flex">
            <GraduationCap className="h-4 w-4" />
            สมัครอบรม
          </Link>
        }
      />

      {/* Hero */}
      <section className="bg-[#031a2c] text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-end gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:pt-20">
          <div>
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
              <span className="h-px w-10" style={{ background: GOLD }} />
              Coaching Courses · AFC
            </p>
            <h1 className={`${display.className} mt-6 text-5xl font-semibold leading-[1.05] sm:text-7xl`}>
              หลักสูตรอบรม
              <br />
              <span style={{ color: GOLD }}>ผู้ฝึกสอน</span>
            </h1>
            <p className="mt-4 text-lg font-semibold">มาตรฐานสมาพันธ์ฟุตบอลเอเชีย (AFC)</p>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/65">
              สมาคมกีฬาฟุตบอลแห่งประเทศไทยฯ ให้ความสำคัญกับการพัฒนาบุคลากรด้านการฝึกสอน เพราะผู้ฝึกสอนคือผู้วางรากฐานให้กับฟุตบอลไทย ตั้งแต่ระดับพื้นฐานจนถึงระดับอาชีพ —
              อ้างอิงจาก{" "}
              <a href="https://fathailand.org/coaching-education?language=th" target="_blank" rel="noopener noreferrer" className="font-semibold underline-offset-2 hover:underline" style={{ color: GOLD }}>
                fathailand.org
              </a>
            </p>
            <dl className="mt-8 flex w-fit divide-x divide-white/15 border-y border-white/15 py-4">
              {[
                { v: "3", l: "สายหลักสูตร" },
                { v: "5", l: "ระดับ Core Program" },
                { v: totalHours.toLocaleString(), l: "ชั่วโมงรวม G → PRO" },
              ].map((s) => (
                <div key={s.l} className="flex flex-col-reverse px-5 first:pl-0 last:pr-0">
                  <dt className="mt-1 text-[11px] text-white/55">{s.l}</dt>
                  <dd className={`${display.className} text-3xl font-semibold`} style={{ color: GOLD }}>
                    {s.v}
                  </dd>
                </div>
              ))}
            </dl>
            <Link
              href="/coach-center#open"
              className="group mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-[#e3bb63] px-6 text-sm font-semibold text-[#031a2c] hover:bg-[#ecc97b]"
            >
              ดูรุ่นที่เปิดรับสมัคร
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <LicenceFan />
        </div>
      </section>

      <CoursesSection />
    </div>
  );
}
