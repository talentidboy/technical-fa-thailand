import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COACH_CENTRE_IMAGE_URL } from "@/lib/brand";
import { LIVE_APPLICATION_STATUSES } from "@/lib/course-workflow";
import { coreProgramSteps } from "@/lib/coach-program";
import { Reveal } from "@/components/g15/Reveal";
import { ModuleHeader } from "@/components/ModuleHeader";
import { BrandLogo } from "@/components/BrandLogo";
import { CountUp } from "@/components/play-and-learn/CountUp";
import { display, levelTone, SectionHead, PathwayStairs } from "@/components/coach/CoachUi";
import { ArrowRight, CalendarDays, Clock, LogIn, MapPin, UserPlus, Users } from "lucide-react";

const h = display.className;

function formatDate(date: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Bangkok" });
}

const STEPS = [
  { title: "สมัครออนไลน์", text: "เลือกรุ่นที่เปิดรับ กรอกใบสมัครครั้งเดียว ระบบสร้างบัญชีผู้ฝึกสอนให้ทันที — ไม่ต้องมีบัญชีมาก่อน" },
  { title: "เข้ารับการอบรม", text: "เจ้าหน้าที่ตรวจสอบและอนุมัติ ติดตามสถานะใบสมัครได้ในหน้าของคุณ" },
  { title: "รับใบอนุญาตออนไลน์", text: "ผ่านการอบรมแล้ว ดาวน์โหลด Diploma / Licence ได้เอง และยื่นต่ออายุออนไลน์เมื่อใกล้หมดอายุ" },
];

const TRACKS = [
  { code: "GK", title: "AFC Goalkeeper Coaching", text: "ผู้ฝึกสอนผู้รักษาประตู 3 ระดับ (C · B · A)" },
  { code: "FIT", title: "AFC Fitness Coaching", text: "ผู้ฝึกสอนฟิตเนส 3 ระดับ (C · B · A)" },
];

// หน้าทางเข้าสาธารณะของศูนย์อบรมผู้ฝึกสอน — รุ่นที่เปิดรับสมัคร + เส้นทางใบอนุญาต ดูได้โดยไม่ต้องล็อกอิน (สมัครจริงต้องมีบัญชี)
// (แอดมิน/เจ้าหน้าที่ใช้ /login ตรง ๆ ตามเดิม)
export default async function CoachCenterPage() {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect(currentUser.role === "COACH" ? "/me" : "/");
  }

  const [openSessions, coachCount, licenseCount] = await Promise.all([
    prisma.courseSession.findMany({
      where: { status: "OPEN" },
      include: {
        course: { select: { title: true, courseType: true, licenseType: true } },
        _count: { select: { applications: { where: { status: { in: LIVE_APPLICATION_STATUSES } } } } },
      },
      orderBy: [{ applicationDeadline: "asc" }, { startDate: "asc" }],
    }),
    prisma.coach.count({ where: { licenseRecords: { some: {} } } }),
    prisma.licenseRecord.count(),
  ]);
  const now = new Date();

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f5f4f0] text-slate-900">
      <ModuleHeader
        title="ศูนย์อบรมผู้ฝึกสอนฟุตบอล"
        subtitle="Coach Education · FA Thailand"
        links={[
          { href: "#open", label: "รุ่นที่เปิดรับสมัคร" },
          { href: "/courses", label: "หลักสูตรทั้งหมด" },
          { href: "#how", label: "ขั้นตอนการสมัคร" },
        ]}
        actions={
          <Link href="/coach-center/login" className="inline-flex items-center gap-1.5 rounded-full bg-[#073c5e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a4a73]">
            <LogIn className="h-4 w-4" />
            เข้าสู่ระบบ
          </Link>
        }
      />

      {/* ===== ฮีโร่ ===== */}
      <section className="px-4 pb-16 pt-10 sm:px-6 lg:pt-14">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16">
          <div>
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700">
              <span className="h-px w-10 bg-amber-600" />
              AFC Coaching Convention · FA Thailand
            </p>
            <h1 className={`${h} mt-6 text-5xl font-semibold leading-[1.02] text-[#073c5e] sm:text-7xl`}>
              ศูนย์อบรม
              <br />
              ผู้ฝึกสอนฟุตบอล
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              พัฒนาผู้ฝึกสอนฟุตบอลไทยตามมาตรฐานสมาพันธ์ฟุตบอลเอเชีย ตั้งแต่ระดับพื้นฐาน G จนถึง PRO — สมัครอบรม ติดตามผล รับใบอนุญาต และต่ออายุได้ในที่เดียว
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={openSessions.length > 0 ? "#open" : "/register"}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#073c5e] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a4a73]"
              >
                {openSessions.length > 0 ? `ดูรุ่นที่เปิดรับสมัคร (${openSessions.length})` : "สมัครบัญชีผู้ฝึกสอน"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/coach-center/login"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-6 py-3.5 text-sm font-semibold text-slate-800 transition-colors hover:border-[#073c5e] hover:text-[#073c5e]"
              >
                มีบัญชีแล้ว — เข้าสู่ระบบ
              </Link>
            </div>

            <dl className="mt-12 grid grid-cols-2 border-y border-slate-300/70 sm:grid-cols-4">
              {[
                { value: coachCount.toLocaleString("en-US"), label: "ผู้ฝึกสอนที่มีใบอนุญาต" },
                { value: licenseCount.toLocaleString("en-US"), label: "ใบอนุญาตที่ออกแล้ว" },
                { value: String(openSessions.length), label: "รุ่นที่เปิดรับสมัคร" },
                { value: "3", label: "สายหลักสูตร AFC" },
              ].map((s, i) => (
                <div key={s.label} className={`flex flex-col-reverse py-4 pr-3 ${i % 2 ? "border-l border-slate-300/70 pl-4" : ""} ${i > 1 ? "border-t border-slate-300/70 sm:border-t-0" : ""} ${i ? "sm:border-l sm:pl-4" : ""}`}>
                  <dt className="text-xs text-slate-500">{s.label}</dt>
                  <dd className={`${h} text-3xl font-semibold tabular-nums text-[#073c5e]`}>
                    <CountUp value={s.value} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ภาพ + เส้นทางใบอนุญาต */}
          <figure className="relative">
            <div className="relative aspect-4/5 overflow-hidden rounded-xl bg-slate-200">
              <Image src={COACH_CENTRE_IMAGE_URL} alt="การอบรมผู้ฝึกสอนตามหลักสูตร AFC" fill priority sizes="(min-width: 1024px) 30rem, 100vw" className="object-cover" />
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-[#04223a] via-[#04223a]/70 to-transparent" />
            </div>
            <div className="absolute inset-x-4 bottom-4 rounded-lg bg-[#04223a]/95 p-5 text-white sm:inset-x-6 sm:bottom-6">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">AFC Coaching Pathway</p>
                <p className="text-[11px] text-white/50">5 ระดับ</p>
              </div>
              <div className="mt-5">
                <PathwayStairs />
              </div>
              <Link href="/courses" className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-sm font-semibold hover:text-amber-200">
                รายละเอียดหลักสูตรทุกระดับ
                <ArrowRight className="h-4 w-4 text-amber-300" />
              </Link>
            </div>
          </figure>
        </div>
      </section>

      {/* ===== เปิดรับสมัคร ===== */}
      <section id="open" className="scroll-mt-20 border-t border-slate-200 bg-white px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionHead eyebrow="Open Courses" title="รุ่นอบรมที่เปิดรับสมัคร" sub="ยังไม่มีบัญชีก็สมัครได้ — ระบบสร้างบัญชีให้พร้อมกับใบสมัคร" />
          {openSessions.length === 0 ? (
            <div className="flex flex-col items-start justify-between gap-5 rounded-xl border border-dashed border-slate-300 bg-[#f5f4f0] p-8 sm:flex-row sm:items-center">
              <div>
                <p className={`${h} text-xl font-semibold text-slate-900`}>ยังไม่มีรุ่นที่เปิดรับสมัครในขณะนี้</p>
                <p className="mt-1 text-sm text-slate-500">สร้างบัญชีไว้ก่อน เมื่อเปิดรุ่นใหม่จะสมัครได้ทันทีจากหน้าของคุณ</p>
              </div>
              <Link href="/register" className="inline-flex flex-none items-center gap-2 rounded-full bg-[#073c5e] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0a4a73]">
                <UserPlus className="h-4 w-4" />
                สมัครบัญชีผู้ฝึกสอน
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {openSessions.map((s, i) => {
                const isGeneral = s.course.courseType === "GENERAL";
                const tone = levelTone(s.course.licenseType);
                const daysLeft = s.applicationDeadline ? Math.ceil((s.applicationDeadline.getTime() - now.getTime()) / 86_400_000) : null;
                const full = s.capacity != null && s._count.applications >= s.capacity;
                return (
                  <Reveal key={s.id} delay={i * 80} className="h-full">
                    <article className="relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <span className="absolute inset-x-0 top-0 h-1" style={{ background: isGeneral ? "#475569" : tone.hex }} />
                      <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-6">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold" style={{ color: isGeneral ? "#475569" : tone.hex }}>
                            {isGeneral ? "อบรมทั่วไป" : `License ${s.course.licenseType}`}
                          </p>
                          <p className={`${h} mt-1 text-xl font-semibold leading-snug text-slate-900`}>{s.course.title}</p>
                          <p className="text-sm text-slate-500">{s.name}</p>
                        </div>
                        {daysLeft != null && daysLeft >= 0 && (
                          <span className={`flex-none rounded-full px-2.5 py-1 text-[11px] font-semibold ${daysLeft <= 7 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
                            {daysLeft === 0 ? "ปิดรับวันนี้" : `ปิดรับใน ${daysLeft} วัน`}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-2.5 border-t border-slate-100 px-5 py-4 text-sm text-slate-600">
                        {(s.startDate || s.endDate) && (
                          <p className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 flex-none text-slate-400" />
                            {formatDate(s.startDate)} – {formatDate(s.endDate)}
                          </p>
                        )}
                        {s.venue && (
                          <p className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 flex-none text-slate-400" />
                            {s.venue}
                          </p>
                        )}
                        {s.capacity != null && (
                          <div>
                            <p className="flex items-center gap-2">
                              <Users className="h-4 w-4 flex-none text-slate-400" />
                              สมัครแล้ว {s._count.applications}/{s.capacity} คน
                            </p>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-[#073c5e]" style={{ width: `${Math.min(100, (s._count.applications / s.capacity) * 100)}%` }} />
                            </div>
                          </div>
                        )}
                        {(s.applicationOpenDate || s.applicationDeadline) && (
                          <p className="flex items-center gap-2 text-xs text-slate-400">
                            <Clock className="h-3.5 w-3.5 flex-none" />
                            รับสมัคร {formatDate(s.applicationOpenDate) ?? "ตั้งแต่วันนี้"} – {formatDate(s.applicationDeadline) ?? "ไม่กำหนด"}
                          </p>
                        )}
                        <div className="mt-auto pt-3">
                          {full ? (
                            <span className="flex w-full items-center justify-center rounded-full bg-slate-100 py-2.5 text-sm font-semibold text-slate-500">เต็มแล้ว</span>
                          ) : (
                            <Link
                              href={`/apply/${s.id}`}
                              className="group flex w-full items-center justify-center gap-1.5 rounded-full bg-[#073c5e] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a4a73]"
                            >
                              สมัครรุ่นนี้
                              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ===== เส้นทางใบอนุญาต ===== */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionHead
            eyebrow="AFC Core Program"
            title="เส้นทางสู่ใบอนุญาตผู้ฝึกสอน"
            sub="ผ่านระดับก่อนหน้าแล้วจึงสมัครระดับถัดไป — ใบอนุญาต C ขึ้นไปมีอายุ 3 ปี ต่ออายุออนไลน์ได้"
            action={
              <Link href="/courses" className="inline-flex items-center gap-1 text-sm font-semibold text-[#073c5e] hover:underline">
                รายละเอียดทุกหลักสูตร <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
            {coreProgramSteps.map((s, i) => {
              const tone = levelTone(s.level);
              return (
                <li key={s.level} className="bg-white">
                  <Reveal delay={i * 70} className="flex h-full flex-col p-6">
                    <div className="flex items-baseline justify-between">
                      <span className={`${h} text-5xl font-semibold leading-none`} style={{ color: tone.hex }}>
                        {s.level}
                      </span>
                      <span className="text-[11px] text-slate-400">ขั้นที่ {i + 1}</span>
                    </div>
                    <p className="mt-5 font-semibold leading-snug text-slate-900">{s.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{s.ageGroup}</p>
                    <p className="mt-auto pt-5 text-xs font-semibold text-slate-600">
                      {s.totalHours} ชม. · {s.days} วัน
                    </p>
                  </Reveal>
                </li>
              );
            })}
          </ol>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {TRACKS.map((t) => (
              <Link key={t.title} href="/courses" className="group flex items-center gap-5 rounded-xl bg-[#04223a] p-5 text-white transition-colors hover:bg-[#073c5e]">
                <span className={`${h} flex h-14 w-14 flex-none items-center justify-center rounded-lg border border-white/20 text-sm font-semibold text-amber-300`}>{t.code}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">Specialist</span>
                  <span className="block font-semibold">{t.title}</span>
                  <span className="block text-sm text-white/60">{t.text}</span>
                </span>
                <ArrowRight className="h-4 w-4 flex-none text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-300" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ขั้นตอน ===== */}
      <section id="how" className="scroll-mt-20 border-y border-slate-200 bg-white px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionHead eyebrow="How it works" title="สมัครอบรม 3 ขั้นตอน" />
          <ol className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 100}>
                <li className="border-t-2 border-[#073c5e] pt-5">
                  <span className={`${h} text-5xl font-semibold leading-none text-amber-500`}>{String(i + 1).padStart(2, "0")}</span>
                  <p className={`${h} mt-4 text-2xl font-semibold text-slate-900`}>{s.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== ชวนสมัคร ===== */}
      <section className="px-4 py-20 sm:px-6">
        <Reveal className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-xl bg-[#073c5e] p-8 text-white sm:p-12 lg:flex-row lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300">Start your journey</p>
            <h2 className={`${h} mt-3 text-3xl font-semibold leading-tight sm:text-4xl`}>พร้อมก้าวสู่ผู้ฝึกสอนมืออาชีพแล้วหรือยัง?</h2>
            <p className="mt-2 max-w-xl text-white/70">มีบัญชีแล้ว เข้าสู่ระบบเพื่อดูใบอนุญาต ดาวน์โหลดใบประกาศ และขอต่ออายุได้ทันที</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/coach-center/login" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#073c5e] hover:bg-slate-100">
              <LogIn className="h-4 w-4" />
              เข้าสู่ระบบ
            </Link>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3.5 text-sm font-semibold text-[#073c5e] hover:bg-amber-300">
              <UserPlus className="h-4 w-4" />
              สมัครบัญชีผู้ฝึกสอน
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-slate-200 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-3">
            <BrandLogo tone="navy" className="h-8" />
            ฝ่ายเทคนิค สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์
          </span>
          <span>Coach Education</span>
        </div>
      </footer>
    </div>
  );
}
