import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { coachCentreBg } from "@/lib/section-images";
import { LIVE_APPLICATION_STATUSES } from "@/lib/course-workflow";
import { coreProgramSteps } from "@/lib/coach-program";
import { Reveal } from "@/components/g15/Reveal";
import { BrandLogo } from "@/components/BrandLogo";
import { CoachCentreLogo } from "@/components/SectionLogos";
import { CountUp } from "@/components/play-and-learn/CountUp";
import { CoachHeader } from "@/components/coach/CoachHeader";
import { LicenceFan } from "@/components/coach/LicenceFan";
import { display, levelTone } from "@/components/coach/CoachUi";
import styles from "@/components/coach/coach.module.css";
import { ArrowRight, ArrowUpRight, CalendarDays, Clock, LogIn, MapPin, UserPlus, Users } from "lucide-react";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "ศูนย์อบรมผู้ฝึกสอนฟุตบอล", description: "สมัครอบรมผู้ฝึกสอนฟุตบอลหลักสูตร AFC ตรวจสอบใบอนุญาตผู้ฝึกสอน และดูรุ่นที่เปิดรับสมัครของสมาคมกีฬาฟุตบอลแห่งประเทศไทย", path: "/coach-center" });

const h = display.className;
const TZ = { timeZone: "Asia/Bangkok" } as const;
const GOLD = "#e3bb63";

function formatDate(date: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString("th-TH", { ...TZ, year: "numeric", month: "short", day: "numeric" });
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
  const maxHours = Math.max(...coreProgramSteps.map((s) => s.totalHours));

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f6f4ef] text-slate-900" style={{ "--paper": "#f6f4ef" } as React.CSSProperties}>
      <CoachHeader
        links={[
          { href: "#open", label: "รุ่นที่เปิดรับสมัคร" },
          { href: "#pathway", label: "เส้นทางใบอนุญาต" },
          { href: "#how", label: "ขั้นตอนการสมัคร" },
          { href: "/courses", label: "หลักสูตรทั้งหมด" },
        ]}
        cta={
          <Link href="/coach-center/login" className="hidden h-10 items-center gap-1.5 rounded-lg bg-[#e3bb63] px-4 text-sm font-semibold text-[#031a2c] hover:bg-[#ecc97b] sm:inline-flex">
            <LogIn className="h-4 w-4" />
            เข้าสู่ระบบ
          </Link>
        }
      />

      {/* ===== ฮีโร่: พื้นกรมท่า + ภาพการอบรมจางๆ + บัตรใบอนุญาต 5 ระดับ ===== */}
      <section className="relative isolate overflow-hidden bg-[#031a2c] text-white">
        <Image src={coachCentreBg} alt="" fill priority placeholder="blur" sizes="100vw" className="-z-10 object-cover object-[60%_30%] opacity-20 grayscale" />
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-end gap-12 px-4 pb-14 pt-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:pb-20 lg:pt-24">
          <div>
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
              <span className="h-px w-10" style={{ background: GOLD }} />
              AFC Coaching Convention · FA Thailand
            </p>
            <h1 className={`${h} mt-6 text-5xl font-semibold leading-[1.05] sm:text-7xl`}>
              ศูนย์อบรม
              <br />
              ผู้ฝึกสอน<span style={{ color: GOLD }}>ฟุตบอล</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              พัฒนาผู้ฝึกสอนฟุตบอลไทยตามมาตรฐานสมาพันธ์ฟุตบอลเอเชีย ตั้งแต่ระดับพื้นฐาน G จนถึง PRO — สมัครอบรม ติดตามผล รับใบอนุญาต และต่ออายุได้ในที่เดียว
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href={openSessions.length > 0 ? "#open" : "/register"}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#e3bb63] px-6 text-sm font-semibold text-[#031a2c] transition-colors hover:bg-[#ecc97b]"
              >
                {openSessions.length > 0 ? `ดูรุ่นที่เปิดรับสมัคร (${openSessions.length})` : "สมัครบัญชีผู้ฝึกสอน"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/coach-center/login" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/30 px-6 text-sm font-semibold hover:bg-white/10">
                มีบัญชีแล้ว — เข้าสู่ระบบ
              </Link>
            </div>
          </div>
          <div>
            <p className="mb-4 flex items-baseline justify-between text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
              <span>AFC Core Program</span>
              <span className="normal-case tracking-normal">G → PRO · 5 ระดับ</span>
            </p>
            <LicenceFan />
          </div>
        </div>

        {/* ตัวเลขสรุป */}
        <div className="border-t border-white/10 bg-[#021424]/80">
          <dl className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:px-6 lg:grid-cols-4">
            {[
              { value: coachCount.toLocaleString("en-US"), label: "ผู้ฝึกสอนที่มีใบอนุญาต" },
              { value: licenseCount.toLocaleString("en-US"), label: "ใบอนุญาตที่ออกแล้ว" },
              { value: String(openSessions.length), label: "รุ่นที่เปิดรับสมัคร" },
              { value: "3", label: "สายหลักสูตร AFC" },
            ].map((s, i) => (
              <div
                key={s.label}
                className={`flex flex-col-reverse py-6 ${i % 2 ? "border-l border-white/10 pl-6" : "pr-6"} ${i > 1 ? "border-t border-white/10 lg:border-t-0" : ""} ${i === 2 ? "lg:border-l lg:pl-6" : ""}`}
              >
                <dt className="mt-1 text-xs text-white/55">{s.label}</dt>
                <dd className={`${h} text-4xl font-semibold tabular-nums`} style={{ color: GOLD }}>
                  <CountUp value={s.value} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ===== รุ่นที่เปิดรับสมัคร: ตั๋วเข้าอบรม ===== */}
      <section id="open" className="scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#a8812f]">Open Courses</p>
              <h2 className={`${h} mt-2 text-4xl font-semibold text-[#031a2c] sm:text-5xl`}>รุ่นอบรมที่เปิดรับสมัคร</h2>
              <p className="mt-2 text-sm text-slate-500">ยังไม่มีบัญชีก็สมัครได้ — ระบบสร้างบัญชีให้พร้อมกับใบสมัคร</p>
            </div>
            <Link href="/courses" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-[#031a2c] hover:underline">
              รายละเอียดหลักสูตรทุกระดับ <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {openSessions.length === 0 ? (
            <div className="flex overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="hidden w-40 flex-none flex-col items-center justify-center bg-[#031a2c] text-white sm:flex">
                <CalendarDays className="h-8 w-8" style={{ color: GOLD }} />
                <span className="mt-2 text-xs text-white/60">รุ่นถัดไป</span>
              </div>
              <div className={`${styles.notch} relative flex flex-1 flex-col items-start justify-between gap-5 border-l-2 border-dashed border-slate-200 p-7 sm:flex-row sm:items-center`}>
                <div>
                  <p className={`${h} text-2xl font-semibold text-slate-900`}>ยังไม่มีรุ่นที่เปิดรับสมัครในขณะนี้</p>
                  <p className="mt-1 text-sm text-slate-500">สร้างบัญชีไว้ก่อน เมื่อเปิดรุ่นใหม่จะสมัครได้ทันทีจากหน้าของคุณ</p>
                </div>
                <Link href="/register" className="inline-flex h-11 flex-none items-center gap-2 rounded-lg bg-[#031a2c] px-5 text-sm font-semibold text-white hover:bg-[#073c5e]">
                  <UserPlus className="h-4 w-4" />
                  สมัครบัญชีผู้ฝึกสอน
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {openSessions.map((s, i) => {
                const isGeneral = s.course.courseType === "GENERAL";
                const color = isGeneral ? "#475569" : levelTone(s.course.licenseType).hex;
                const daysLeft = s.applicationDeadline ? Math.ceil((s.applicationDeadline.getTime() - now.getTime()) / 86_400_000) : null;
                const full = s.capacity != null && s._count.applications >= s.capacity;
                return (
                  <Reveal key={s.id} delay={i * 90}>
                    <article className="flex overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                      {/* ต้นขั้วตั๋ว: วันเริ่มอบรม */}
                      <div className="flex w-28 flex-none flex-col items-center justify-center px-3 py-6 text-white sm:w-36" style={{ background: color }}>
                        {s.startDate ? (
                          <>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Start</span>
                            <span className={`${h} mt-1 text-5xl font-semibold leading-none`}>{s.startDate.toLocaleDateString("th-TH", { ...TZ, day: "numeric" })}</span>
                            <span className="mt-1 text-sm font-medium">{s.startDate.toLocaleDateString("th-TH", { ...TZ, month: "short", year: "2-digit" })}</span>
                          </>
                        ) : (
                          <CalendarDays className="h-8 w-8" />
                        )}
                        <span className={`${h} mt-4 rounded-md bg-white/15 px-2 py-0.5 text-sm font-semibold`}>{isGeneral ? "GEN" : s.course.licenseType}</span>
                      </div>
                      {/* ตัวตั๋ว */}
                      <div className={`${styles.notch} relative flex min-w-0 flex-1 flex-col border-l-2 border-dashed border-slate-200 p-5 sm:p-6`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold" style={{ color }}>
                              {isGeneral ? "อบรมทั่วไป" : `License ${s.course.licenseType}`}
                            </p>
                            <h3 className={`${h} mt-0.5 text-xl font-semibold leading-snug text-slate-900 sm:text-2xl`}>{s.course.title}</h3>
                            <p className="text-sm text-slate-500">{s.name}</p>
                          </div>
                          {daysLeft != null && daysLeft >= 0 && (
                            <span className={`flex-none rounded-md px-2 py-1 text-[11px] font-semibold ${daysLeft <= 7 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
                              {daysLeft === 0 ? "ปิดรับวันนี้" : `ปิดรับใน ${daysLeft} วัน`}
                            </span>
                          )}
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
                          {(s.startDate || s.endDate) && (
                            <p className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 flex-none text-slate-400" />
                              {formatDate(s.startDate)} – {formatDate(s.endDate)}
                            </p>
                          )}
                          {s.venue && (
                            <p className="flex min-w-0 items-center gap-2">
                              <MapPin className="h-4 w-4 flex-none text-slate-400" />
                              <span className="truncate">{s.venue}</span>
                            </p>
                          )}
                          {(s.applicationOpenDate || s.applicationDeadline) && (
                            <p className="flex items-center gap-2 text-xs text-slate-400 sm:col-span-2">
                              <Clock className="h-3.5 w-3.5 flex-none" />
                              รับสมัคร {formatDate(s.applicationOpenDate) ?? "ตั้งแต่วันนี้"} – {formatDate(s.applicationDeadline) ?? "ไม่กำหนด"}
                            </p>
                          )}
                        </div>
                        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
                          {s.capacity != null ? (
                            <div className="min-w-0 flex-1">
                              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Users className="h-3.5 w-3.5" />
                                สมัครแล้ว {s._count.applications}/{s.capacity} คน
                              </p>
                              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (s._count.applications / s.capacity) * 100)}%`, background: color }} />
                              </div>
                            </div>
                          ) : (
                            <span />
                          )}
                          {full ? (
                            <span className="inline-flex h-10 flex-none items-center rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-500">เต็มแล้ว</span>
                          ) : (
                            <Link
                              href={`/apply/${s.id}`}
                              className="group inline-flex h-10 flex-none items-center gap-1.5 rounded-lg bg-[#031a2c] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#073c5e]"
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

      {/* ===== เส้นทางใบอนุญาต: บันไดตามชั่วโมงเรียนจริง ===== */}
      <section id="pathway" className="scroll-mt-20 bg-[#031a2c] px-4 py-20 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
                AFC Core Program
              </p>
              <h2 className={`${h} mt-2 text-4xl font-semibold sm:text-5xl`}>
                เส้นทางสู่ใบอนุญาต<span className="whitespace-nowrap">ผู้ฝึกสอน</span>
              </h2>
              <p className="mt-2 max-w-xl text-sm text-white/60">ผ่านระดับก่อนหน้าแล้วจึงสมัครระดับถัดไป — ความสูงของแต่ละขั้นคือชั่วโมงเรียนจริงของหลักสูตร</p>
            </div>
            <Link href="/courses" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold hover:underline" style={{ color: GOLD }}>
              ดูรายวิชาทุกระดับ <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <ol className="grid grid-cols-5 items-end gap-2 sm:gap-4">
            {coreProgramSteps.map((s, i) => (
              <li key={s.level} className="flex flex-col">
                <Reveal delay={i * 90} className="flex flex-col justify-end">
                  <span className="mb-2 text-xs font-semibold tabular-nums text-white/60 sm:text-sm">{s.totalHours} ชม.</span>
                  <Link
                    href={`/courses#level-${s.level}`}
                    className="flex flex-col justify-between rounded-t-xl p-2.5 transition-[filter] hover:brightness-110 sm:p-4"
                    style={{ height: `${Math.round(5 + (s.totalHours / maxHours) * 15)}rem`, background: levelTone(s.level).hex }}
                  >
                    <span className={`${h} text-2xl font-semibold leading-none sm:text-5xl`}>{s.level}</span>
                    <span className="hidden text-xs text-white/80 sm:block">{s.days} วัน</span>
                  </Link>
                </Reveal>
                <div className="border-t border-white/15 pt-3">
                  <p className="hidden text-sm font-semibold leading-snug sm:block">{s.title}</p>
                  <p className="mt-0.5 hidden text-xs leading-snug text-white/50 md:block">{s.ageGroup}</p>
                </div>
              </li>
            ))}
          </ol>
          {/* โทรศัพท์: รายชื่อหลักสูตรใต้บันได */}
          <ul className="mt-6 divide-y divide-white/10 border-y border-white/10 sm:hidden">
            {coreProgramSteps.map((s) => (
              <li key={s.level} className="flex items-baseline gap-3 py-2.5 text-sm">
                <span className={`${h} w-9 font-semibold`} style={{ color: GOLD }}>
                  {s.level}
                </span>
                <span className="flex-1 truncate">{s.title}</span>
                <span className="text-xs text-white/50">{s.days} วัน</span>
              </li>
            ))}
          </ul>

          <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2">
            {TRACKS.map((t) => (
              <Link
                key={t.title}
                href="/courses#specialist"
                className="group flex items-center gap-5 rounded-xl border border-white/15 p-5 transition-colors hover:border-[#e3bb63]/60 hover:bg-white/[0.03]"
              >
                <span className={`${h} flex h-14 w-16 flex-none items-center justify-center rounded-lg text-base font-semibold text-[#031a2c]`} style={{ background: GOLD }}>
                  {t.code}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">Specialist track</span>
                  <span className={`${h} block text-lg font-semibold`}>{t.title}</span>
                  <span className="block text-sm text-white/60">{t.text}</span>
                </span>
                <ArrowUpRight className="h-5 w-5 flex-none text-white/40 transition-colors group-hover:text-[#e3bb63]" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ขั้นตอนการสมัคร ===== */}
      <section id="how" className="scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#a8812f]">How it works</p>
          <h2 className={`${h} mt-2 text-4xl font-semibold text-[#031a2c] sm:text-5xl`}>สมัครอบรม 3 ขั้นตอน</h2>
          <ol className="relative mt-12 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            <span aria-hidden className="absolute left-7 right-[16%] top-7 hidden h-px bg-[#031a2c]/15 md:block" />
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative">
                <Reveal delay={i * 110}>
                  <span className={`${h} relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#031a2c] bg-[#f6f4ef] text-xl font-semibold text-[#031a2c]`}>
                    {i + 1}
                  </span>
                  <p className={`${h} mt-5 text-2xl font-semibold text-slate-900`}>{s.title}</p>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">{s.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== ชวนสมัคร (แถบทอง) ===== */}
      <section className="px-4 pb-20 sm:px-6">
        <Reveal className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-2xl bg-[#e3bb63] p-8 text-[#031a2c] sm:p-12 lg:flex-row lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#031a2c]/60">Start your journey</p>
            <h2 className={`${h} mt-3 text-3xl font-semibold leading-tight sm:text-4xl`}>พร้อมก้าวสู่ผู้ฝึกสอนมืออาชีพแล้วหรือยัง?</h2>
            <p className="mt-2 max-w-xl text-[#031a2c]/75">มีบัญชีแล้ว เข้าสู่ระบบเพื่อดูใบอนุญาต ดาวน์โหลดใบประกาศ และขอต่ออายุได้ทันที</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/coach-center/login" className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#031a2c] px-6 text-sm font-semibold text-white hover:bg-[#073c5e]">
              <LogIn className="h-4 w-4" />
              เข้าสู่ระบบ
            </Link>
            <Link href="/register" className="inline-flex h-12 items-center gap-2 rounded-lg border-2 border-[#031a2c] px-6 text-sm font-semibold hover:bg-[#031a2c]/5">
              <UserPlus className="h-4 w-4" />
              สมัครบัญชีผู้ฝึกสอน
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="bg-[#031a2c] px-4 py-10 text-white/60 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-3">
            <BrandLogo tone="white" className="h-9" />
            <span className="h-7 w-px bg-white/20" />
            <CoachCentreLogo tone="white" className="h-5" />
            <span className="ml-2 max-w-xs leading-relaxed">ฝ่ายเทคนิค สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์</span>
          </span>
          <span>Coach Education · AFC Coaching Convention</span>
        </div>
      </footer>
    </div>
  );
}
