import Link from "next/link";
import { requireCoach } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  LICENSE_TYPES,
  RECORD_TYPES,
  GENDER_OPTIONS,
  CORE_LICENSE_PROGRESSION,
  AFC_CERTIFICATE_LEVELS,
  labelFor,
} from "@/lib/constants";
import { getLicenseStatus, LICENSE_STATUS_STYLES } from "@/lib/license-status";
import { getHighestCoreLevel, getNextCoreLevel } from "@/lib/license-rank";
import { getCountryByCode, getFlagEmoji } from "@/lib/countries";
import { formatThaiAddress } from "@/lib/thai-address";
import { coreProgramSteps } from "@/lib/coach-program";
import { APPLICATION_STATUS, LIVE_APPLICATION_STATUSES } from "@/lib/course-workflow";
import { Reveal } from "@/components/g15/Reveal";
import { SectionHead, LicenceCard, levelTone, display } from "@/components/coach/CoachUi";
import { applyToSession } from "./courses/actions";
import { cancelRenewalRequest } from "./renewal-actions";
import { RenewalRequestForm } from "@/components/renewal/RenewalRequestForm";
import { canRequestRenewal, currentLicenseRecords, daysUntil } from "@/lib/license-renewal";
import {
  Mail,
  Phone,
  MapPin,
  IdCard,
  Download,
  FileBadge,
  Pencil,
  GraduationCap,
  CheckCircle2,
  UserCircle2,
  Briefcase,
  CalendarDays,
  Users,
  Lock,
  ArrowRight,
  Sparkles,
  Clock,
  AlertCircle,
  BookOpen,
  Settings,
  RefreshCw,
} from "lucide-react";

function formatDate(date: Date | null) {
  if (!date) return "-";
  return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}
const shortDate = (date: Date | null) =>
  date ? date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : null;

const APP_STATUS = APPLICATION_STATUS;

// หน้าแรกของผู้ฝึกสอน — หลักสูตรอบรมขึ้นก่อน (รุ่นที่เปิดรับ + เส้นทางใบอนุญาต) แล้วจึงเป็นใบอนุญาต/ประวัติของฉัน
export default async function CoachHomePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; applied?: string; error?: string }>;
}) {
  const user = await requireCoach();
  const coachId = user.coachId!;
  const { saved, applied, error } = await searchParams;

  const [coach, sessions, myApplications] = await Promise.all([
    prisma.coach.findUnique({
      where: { id: coachId },
      include: {
        licenseRecords: {
          orderBy: { issueDate: "desc" },
          include: { renewals: { orderBy: { requestedAt: "desc" }, take: 3 } },
        },
        employments: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.courseSession.findMany({
      where: { status: "OPEN" },
      include: {
        course: true,
        _count: { select: { applications: { where: { status: { in: LIVE_APPLICATION_STATUSES } } } } },
      },
      orderBy: [{ startDate: "asc" }, { id: "asc" }],
    }),
    prisma.application.findMany({
      where: { coachId },
      include: { courseSession: { include: { course: true } } },
      orderBy: { appliedAt: "desc" },
      take: 5,
    }),
  ]);

  if (!coach) {
    return <p className="text-sm text-red-600">ไม่พบข้อมูลผู้ฝึกสอนของคุณ</p>;
  }

  const currentLevel = getHighestCoreLevel(coach.licenseRecords);
  const nextLevel = getNextCoreLevel(currentLevel);
  const currentIdx = currentLevel ? CORE_LICENSE_PROGRESSION.indexOf(currentLevel) : -1;
  const appliedIds = new Set(
    myApplications.filter((a) => LIVE_APPLICATION_STATUSES.includes(a.status)).map((a) => a.courseSessionId),
  );
  const now = new Date();

  // รุ่นที่สมัครได้ขึ้นก่อน (อบรมทั่วไป หรือหลักสูตรระดับถัดไปของฉัน)
  const sessionRows = sessions
    .map((s) => {
      const isGeneral = s.course.courseType === "GENERAL";
      const eligible = isGeneral || s.course.licenseType === nextLevel;
      const full = s.capacity != null && s._count.applications >= s.capacity;
      const deadlinePassed = s.applicationDeadline != null && s.applicationDeadline < now;
      const notYetOpen = s.applicationOpenDate != null && s.applicationOpenDate > now;
      const applied = appliedIds.has(s.id);
      const canApply = eligible && !applied && !full && !deadlinePassed && !notYetOpen;
      // หลักสูตรระดับที่ผ่านมาแล้ว (หรือต่ำกว่าระดับปัจจุบัน)
      const levelIdx = s.course.licenseType ? CORE_LICENSE_PROGRESSION.indexOf(s.course.licenseType) : -1;
      const passed = !isGeneral && levelIdx !== -1 && levelIdx <= currentIdx;
      const reason = passed
        ? "ผ่านระดับนี้แล้ว"
        : !eligible
          ? `ต้องผ่านระดับก่อนหน้าก่อน`
        : full
          ? "เต็มแล้ว"
          : notYetOpen
            ? `เปิดรับ ${shortDate(s.applicationOpenDate)}`
            : deadlinePassed
              ? "หมดเขตสมัคร"
              : null;
      return { s, isGeneral, eligible, applied, canApply, reason, passed };
    })
    .sort(
      (a, b) =>
        Number(b.canApply) - Number(a.canApply) || Number(b.eligible) - Number(a.eligible) || Number(a.passed) - Number(b.passed),
    );

  // นับสถานะเฉพาะใบระดับสูงสุดของแต่ละสาย — ใบที่อัปเกรดไปแล้ว (เช่น B เมื่อมี A) ไม่นับว่า "หมดอายุ"
  const current = currentLicenseRecords(coach.licenseRecords);
  const currentIds = new Set(current.map((r) => r.id));
  const licenseStatuses = current.map((r) => getLicenseStatus(r.expireDate));
  // ใบที่ควรต่ออายุ (ใกล้หมด/หมดแล้ว และยังไม่ได้ส่งคำขอ) — แจ้งเตือนบนหัวข้อใบอนุญาต
  const renewDue = current.filter((r) => canRequestRenewal(r.expireDate, now) && !r.renewals.some((x) => x.status === "PENDING"));
  const counts = {
    total: coach.licenseRecords.length,
    active: licenseStatuses.filter((s) => s === "active").length,
    expiring: licenseStatuses.filter((s) => s === "expiring").length,
    expired: licenseStatuses.filter((s) => s === "expired").length,
  };
  const country = getCountryByCode(coach.nationalityCode);
  const fullNameEn = [coach.nameEn, coach.familyNameEn].filter(Boolean).join(" ");
  const job = coach.employments[0];
  // บัตรดิจิทัลบนหัวหน้า = ใบระดับหลักปัจจุบัน
  const coreCard = current.find((r) => CORE_LICENSE_PROGRESSION.includes(r.licenseType)) ?? null;
  const STATUS_DOT: Record<string, string> = { active: "bg-emerald-400", expiring: "bg-amber-300", expired: "bg-red-400", unknown: "bg-white/60" };
  const nextStep = coreProgramSteps.find((c) => c.level === nextLevel) ?? null;

  return (
    <div className="space-y-8">
      {/* ===== ส่วนหัว: ทักทาย + บัตรใบอนุญาตดิจิทัล + ปุ่มลัด ===== */}
      <Reveal>
        <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#070b1f] p-6 text-white shadow-xl shadow-indigo-950/30 sm:p-8">
          <div className="absolute inset-x-0 top-0 h-1 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
          <div aria-hidden className="absolute -left-24 -top-32 -z-10 h-96 w-96 rounded-full bg-indigo-600/40 blur-[100px]" />
          <div aria-hidden className="absolute -bottom-32 -right-16 -z-10 h-80 w-80 rounded-full bg-amber-400/20 blur-[100px]" />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_at_top_left,black_10%,transparent_70%)]"
          />

          <div className="grid items-center gap-8 lg:grid-cols-[1fr_20rem]">
            <div className="min-w-0">
              <div className="flex items-center gap-4 sm:gap-5">
                {coach.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coach.photoUrl} alt="" className="h-20 w-20 flex-none rounded-2xl object-cover ring-2 ring-white/20 sm:h-24 sm:w-24" />
                ) : (
                  <div className="flex h-20 w-20 flex-none items-center justify-center rounded-2xl bg-white/10 text-3xl font-bold text-amber-300 ring-2 ring-white/15 sm:h-24 sm:w-24">
                    {coach.nameTh.replace(/^[เแโใไ]/, "").charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className={`${display.className} text-[11px] font-extrabold uppercase tracking-[0.25em] text-amber-300`}>Coach Dashboard</p>
                  <h1 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">
                    {coach.nameTh} {coach.surnameTh}
                  </h1>
                  {fullNameEn && <p className="truncate text-sm text-white/55">{fullNameEn}</p>}
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-white/10 px-3 py-1 font-semibold ring-1 ring-white/15">{coach.afcId ? `AFC ID ${coach.afcId}` : "ยังไม่มี AFC ID"}</span>
                <span className="rounded-full bg-amber-400 px-3 py-1 font-bold text-amber-950">
                  {currentLevel ? `ใบอนุญาตระดับ ${currentLevel}` : "ยังไม่มีใบอนุญาต"}
                </span>
                {job && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
                    <Briefcase className="h-3 w-3" />
                    {job.clubName}
                    {job.position && ` · ${job.position}`}
                  </span>
                )}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                <Link
                  href="/me/courses"
                  className="inline-flex flex-col items-center justify-center gap-1 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-amber-950 shadow-lg shadow-amber-500/20 transition-colors hover:bg-amber-300 sm:flex-row sm:gap-2 sm:text-sm"
                >
                  <GraduationCap className="h-4 w-4" />
                  สมัครเข้าอบรม
                </Link>
                <Link
                  href="/me/card"
                  className="inline-flex flex-col items-center justify-center gap-1 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/20 sm:flex-row sm:gap-2 sm:text-sm"
                >
                  <IdCard className="h-4 w-4" />
                  บัตรประจำตัว
                </Link>
                <Link
                  href="/me/settings"
                  className="inline-flex flex-col items-center justify-center gap-1 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/20 sm:flex-row sm:gap-2 sm:text-sm"
                >
                  <Settings className="h-4 w-4" />
                  ตั้งค่า
                </Link>
              </div>
            </div>

            {/* บัตรใบอนุญาตดิจิทัล (ระดับหลักปัจจุบัน) */}
            {coreCard ? (
              <div className="mx-auto w-full max-w-80 lg:mx-0">
                <LicenceCard
                  level={coreCard.licenseType}
                  name={fullNameEn || `${coach.nameTh} ${coach.surnameTh}`}
                  certificateNo={coreCard.certificateNo}
                  expire={coreCard.expireDate ? formatDate(coreCard.expireDate) : null}
                  statusLabel={LICENSE_STATUS_STYLES[getLicenseStatus(coreCard.expireDate)].label}
                  statusDot={STATUS_DOT[getLicenseStatus(coreCard.expireDate)]}
                />
              </div>
            ) : (
              <div className="mx-auto flex aspect-[1.6/1] w-full max-w-80 flex-col items-center justify-center rounded-2xl border border-dashed border-white/25 bg-white/5 text-center lg:mx-0">
                <FileBadge className="h-8 w-8 text-white/40" />
                <p className="mt-2 text-sm font-semibold text-white/70">ยังไม่มีใบอนุญาต</p>
                <p className="text-xs text-white/45">เริ่มจากหลักสูตรระดับ G</p>
              </div>
            )}
          </div>
        </section>
      </Reveal>

      {saved && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 flex-none" />
          บันทึกข้อมูลเรียบร้อยแล้ว
        </p>
      )}
      {applied && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 flex-none" />
          ส่งใบสมัครแล้ว รอเจ้าหน้าที่ตรวจสอบ
        </p>
      )}
      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-none" />
          {error}
        </p>
      )}

      {/* ===== หลักสูตรอบรม (แสดงก่อน) ===== */}
      <section>
        <SectionHead
          no="01"
          eyebrow="Courses"
          title="หลักสูตรอบรม"
          sub={
            nextLevel ? (
              <>
                ระดับถัดไปที่คุณสมัครได้: <b className="text-indigo-700">{nextLevel}</b>
              </>
            ) : (
              "คุณผ่านระดับสูงสุด (PRO) แล้ว — สมัครอบรมทั่วไปได้เสมอ"
            )
          }
          action={
            <Link href="/me/courses" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900">
              ดูทั้งหมด / ใบสมัครของฉัน <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />

        {/* รุ่นที่เปิดรับสมัคร */}
        {sessionRows.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sessionRows.map(({ s, isGeneral, eligible, applied: done, canApply, reason, passed }) => (
              <Reveal key={s.id}>
                <div
                  className={`flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                    canApply ? "ring-amber-300" : "ring-slate-200"
                  }`}
                >
                  <div className={`flex items-center gap-3 px-5 py-4 ${eligible ? "bg-linear-to-r from-indigo-800 to-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <span
                      className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl text-lg font-black ${
                        eligible ? "bg-amber-400 text-amber-950" : "bg-white text-slate-400"
                      }`}
                    >
                      {isGeneral ? <BookOpen className="h-5 w-5" /> : s.course.licenseType}
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-2 font-bold leading-snug">{s.course.title}</p>
                      <p className={`text-xs ${eligible ? "text-indigo-200" : "text-slate-400"}`}>
                        {isGeneral ? "อบรมทั่วไป · เปิดรับทุกระดับ" : `หลักสูตรระดับ ${s.course.licenseType}`} · {s.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 px-5 py-4 text-sm text-slate-600">
                    {(s.startDate || s.endDate) && (
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 flex-none text-indigo-500" />
                        {formatDate(s.startDate)} – {formatDate(s.endDate)}
                      </p>
                    )}
                    {s.venue && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 flex-none text-indigo-500" />
                        {s.venue}
                      </p>
                    )}
                    {s.capacity != null && (
                      <div>
                        <p className="flex items-center gap-2">
                          <Users className="h-4 w-4 flex-none text-indigo-500" />
                          สมัครแล้ว {s._count.applications}/{s.capacity} คน
                        </p>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${Math.min(100, (s._count.applications / s.capacity) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {(s.applicationOpenDate || s.applicationDeadline) && (
                      <p className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="h-3.5 w-3.5 flex-none" />
                        รับสมัคร {shortDate(s.applicationOpenDate) ?? "ตั้งแต่วันนี้"} – {shortDate(s.applicationDeadline) ?? "ไม่กำหนด"}
                      </p>
                    )}
                    <div className="mt-auto pt-3">
                      {done ? (
                        <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-50 py-2.5 text-sm font-semibold text-indigo-700">
                          <CheckCircle2 className="h-4 w-4" /> สมัครแล้ว
                        </span>
                      ) : canApply ? (
                        <form action={applyToSession}>
                          <input type="hidden" name="courseSessionId" value={s.id} />
                          <input type="hidden" name="from" value="home" />
                          <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-400 py-2.5 text-sm font-bold text-amber-950 shadow-sm transition-colors hover:bg-amber-300"
                          >
                            <GraduationCap className="h-4 w-4" /> สมัครรุ่นนี้
                          </button>
                        </form>
                      ) : (
                        <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-500">
                          {passed ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : !eligible && <Lock className="h-4 w-4" />}
                          {reason ?? "สมัครไม่ได้"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <CalendarDays className="h-6 w-6" />
            </span>
            <p className="font-semibold text-slate-700">ยังไม่มีรุ่นอบรมที่เปิดรับสมัครในขณะนี้</p>
            <p className="text-sm text-slate-500">เมื่อมีรุ่นใหม่เปิดรับ จะแสดงที่นี่และสมัครได้ทันที</p>
          </div>
        )}

        {/* เส้นทางใบอนุญาตของฉัน G → C → B → A → PRO */}
        <Reveal>
          <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <p className="mb-4 flex items-center gap-2 font-bold text-slate-900">
              <Sparkles className="h-4 w-4 text-amber-500" />
              เส้นทางใบอนุญาตของฉัน <span className="hidden text-sm font-normal text-slate-400 sm:inline">/ AFC Coaching Pathway</span>
            </p>
            <ol className="grid grid-cols-5 gap-1.5 sm:gap-3">
              {CORE_LICENSE_PROGRESSION.map((level, i) => {
                const done = i <= currentIdx;
                const isNext = level === nextLevel;
                const step = coreProgramSteps.find((c) => c.level === level);
                return (
                  <li key={level} className="relative">
                    {i > 0 && (
                      <span
                        aria-hidden
                        className={`absolute right-1/2 top-6 h-1 w-full -translate-y-1/2 rounded-full sm:top-7 ${i <= currentIdx ? "bg-emerald-400" : "bg-slate-200"}`}
                      />
                    )}
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl text-base font-black ring-4 ring-white sm:h-14 sm:w-14 sm:text-lg ${
                          done
                            ? "bg-emerald-500 text-white"
                            : isNext
                              ? "bg-amber-400 text-amber-950 shadow-lg shadow-amber-400/40"
                              : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {done ? <CheckCircle2 className="h-6 w-6" /> : level}
                      </span>
                      <span className={`mt-2 text-xs font-bold sm:text-sm ${isNext ? "text-amber-700" : done ? "text-emerald-700" : "text-slate-400"}`}>
                        {level}
                      </span>
                      <span className="hidden text-[11px] text-slate-400 sm:block">
                        {done ? "ผ่านแล้ว" : isNext ? "ระดับถัดไป" : step ? `${step.days} วัน` : ""}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
            {nextStep && (
              <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-amber-700">ระดับถัดไปของคุณ</p>
                  <p className="font-bold text-slate-900">{nextStep.title}</p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {nextStep.ageGroup} · {nextStep.totalHours} ชั่วโมง · {nextStep.days} วัน
                  </p>
                </div>
                <Link
                  href="/courses"
                  className="inline-flex flex-none items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-amber-800 ring-1 ring-amber-300 hover:bg-amber-100"
                >
                  รายละเอียดหลักสูตร <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </Reveal>

        {/* ใบสมัครล่าสุดของฉัน */}
        {myApplications.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <p className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5 font-bold text-slate-900">
              <Clock className="h-4 w-4 text-indigo-500" />
              ใบสมัครของฉัน
            </p>
            <ul className="divide-y divide-slate-100">
              {myApplications.map((app) => {
                const st = APP_STATUS[app.status] ?? APP_STATUS.PENDING;
                return (
                  <li key={app.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {app.courseSession.course.title} · {app.courseSession.name}
                      </p>
                      <p className="text-xs text-slate-400">สมัครเมื่อ {formatDate(app.appliedAt)}</p>
                    </div>
                    <span className={`flex-none rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${st.className}`}>{st.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* ===== ใบอนุญาตของฉัน ===== */}
      <section>
        <SectionHead no="02" eyebrow="My Licences" title="ใบอนุญาตของฉัน" sub="ดาวน์โหลดใบประกาศ (Diploma) / บัตรใบอนุญาต (Licence) และขอต่ออายุได้ที่การ์ดแต่ละใบ" />
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "ใบอนุญาตทั้งหมด", value: counts.total, tone: "bg-indigo-50 text-indigo-700" },
            { label: "ใช้งานได้", value: counts.active, tone: "bg-emerald-50 text-emerald-700" },
            { label: "ใกล้หมดอายุ", value: counts.expiring, tone: "bg-amber-50 text-amber-700" },
            { label: "หมดอายุแล้ว", value: counts.expired, tone: "bg-red-50 text-red-700" },
          ].map((c) => (
            <div key={c.label} className={`rounded-2xl px-4 py-3 ${c.tone}`}>
              <p className="text-2xl font-extrabold leading-none">{c.value}</p>
              <p className="mt-1 text-xs font-medium opacity-80">{c.label}</p>
            </div>
          ))}
        </div>
        {renewDue.length > 0 && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
            <RefreshCw className="mt-0.5 h-4 w-4 flex-none text-amber-600" />
            <p>
              {renewDue
                .map((r) => {
                  const d = daysUntil(r.expireDate!, now);
                  return `ใบอนุญาต ${labelFor(LICENSE_TYPES, r.licenseType)} ${d < 0 ? "หมดอายุแล้ว" : `จะหมดอายุในอีก ${d} วัน`}`;
                })
                .join(" · ")}{" "}
              — กด &ldquo;ขอต่ออายุใบอนุญาต&rdquo; ที่การ์ดด้านล่าง
            </p>
          </div>
        )}
        {coach.licenseRecords.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FileBadge className="h-6 w-6" />
            </span>
            <p className="font-semibold text-slate-700">ยังไม่มีใบอนุญาตในระบบ</p>
            <p className="text-sm text-slate-500">เริ่มต้นจากหลักสูตรระดับ G — เมื่อผ่านการอบรม ใบอนุญาตจะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {coach.licenseRecords.map((record) => {
              const isCurrent = currentIds.has(record.id);
              const style = isCurrent
                ? LICENSE_STATUS_STYLES[getLicenseStatus(record.expireDate)]
                : { label: "มีระดับสูงกว่าแล้ว", className: "bg-slate-100 text-slate-500" };
              const pendingRenewal = record.renewals.find((x) => x.status === "PENDING");
              const lastRenewal = record.renewals[0];
              return (
                <div
                  key={record.id}
                  className={`flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-md ${isCurrent ? "" : "opacity-80"}`}
                >
                  <div className={`relative overflow-hidden bg-linear-to-br px-5 py-4 text-white ${isCurrent ? levelTone(record.licenseType).card : "from-slate-400 to-slate-600"}`}>
                    <span aria-hidden className={`${display.className} absolute -bottom-7 -right-1 select-none text-8xl font-black leading-none text-white/12`}>
                      {labelFor(LICENSE_TYPES, record.licenseType)}
                    </span>
                    <div className="relative flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">{labelFor(RECORD_TYPES, record.recordType)}</p>
                        <p className="mt-0.5 font-bold">ใบอนุญาตระดับ {labelFor(LICENSE_TYPES, record.licenseType)}</p>
                      </div>
                      <span className={`flex-none rounded-full px-2.5 py-1 text-xs font-semibold ${style.className}`}>{style.label}</span>
                    </div>
                    <div className="relative mt-3 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-white/80">
                      <span className="font-mono">เลขที่ {record.certificateNo ?? "-"}</span>
                      <span>ออก {formatDate(record.issueDate)}</span>
                      <span>หมดอายุ {formatDate(record.expireDate)}</span>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col p-4">
                    {isCurrent && lastRenewal?.status === "APPROVED" && !pendingRenewal && (
                      <p className="mt-1 text-xs font-medium text-emerald-700">ต่ออายุล่าสุดเมื่อ {formatDate(lastRenewal.reviewedAt)}</p>
                    )}
                    {isCurrent && pendingRenewal ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
                        <Clock className="h-3.5 w-3.5 flex-none text-amber-600" />
                        <span className="flex-1">ส่งคำขอต่ออายุแล้วเมื่อ {formatDate(pendingRenewal.requestedAt)} — รอเจ้าหน้าที่ตรวจสอบ</span>
                        <form action={cancelRenewalRequest}>
                          <input type="hidden" name="id" value={pendingRenewal.id} />
                          <button type="submit" className="font-semibold text-amber-700 underline-offset-2 hover:underline">
                            ยกเลิกคำขอ
                          </button>
                        </form>
                      </div>
                    ) : isCurrent && canRequestRenewal(record.expireDate, now) ? (
                      <>
                        {lastRenewal?.status === "REJECTED" && (
                          <p className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-none" />
                            คำขอครั้งก่อนไม่อนุมัติ: {lastRenewal.reviewNote}
                          </p>
                        )}
                        <RenewalRequestForm recordId={record.id} licenseLabel={labelFor(LICENSE_TYPES, record.licenseType) ?? record.licenseType} />
                      </>
                    ) : null}
                    {AFC_CERTIFICATE_LEVELS.includes(record.licenseType) ? (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        <a
                          href={`/me/certificate/${record.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Diploma
                        </a>
                        <a
                          href={`/me/certificate/${record.id}?type=licence`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                        >
                          <IdCard className="h-3.5 w-3.5" />
                          Licence
                        </a>
                      </div>
                    ) : (
                      <a
                        href={`/me/certificate/${record.id}`}
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                      >
                        <Download className="h-3.5 w-3.5" />
                        ดาวน์โหลดใบประกาศ
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== ข้อมูลส่วนตัว + ประวัติการทำงาน ===== */}
      <section>
        <SectionHead no="03" eyebrow="Profile" title="ข้อมูลของฉัน" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
              <p className="flex items-center gap-2 font-bold text-slate-900">
                <UserCircle2 className="h-4 w-4 text-indigo-500" />
                ข้อมูลของฉัน
              </p>
              <Link href="/me/settings" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900">
                <Pencil className="h-3.5 w-3.5" /> แก้ไข
              </Link>
            </div>
            <dl className="divide-y divide-slate-100 text-sm">
              {[
                { icon: Mail, label: "อีเมล", value: coach.email ?? "-" },
                { icon: Phone, label: "โทรศัพท์", value: coach.telNo ?? "-" },
                { icon: MapPin, label: "ที่อยู่", value: formatThaiAddress(coach) ?? coach.residence ?? "-" },
                {
                  icon: UserCircle2,
                  label: "สัญชาติ / เพศ",
                  value:
                    [country ? `${getFlagEmoji(coach.nationalityCode) ?? ""} ${country.nameTh}`.trim() : null, coach.gender ? labelFor(GENDER_OPTIONS, coach.gender) : null]
                      .filter(Boolean)
                      .join(" · ") || "-",
                },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 px-5 py-3">
                  <Icon className="mt-0.5 h-4 w-4 flex-none text-slate-400" />
                  <dt className="w-24 flex-none text-slate-400">{label}</dt>
                  <dd className="min-w-0 flex-1 wrap-break-word text-slate-700">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <p className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5 font-bold text-slate-900">
              <Briefcase className="h-4 w-4 text-amber-500" />
              ประวัติการทำงาน
            </p>
            {coach.employments.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">ยังไม่มีประวัติการทำงาน</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {coach.employments.map((emp) => (
                  <li key={emp.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{emp.clubName}</p>
                      <p className="text-xs text-slate-500">{[emp.division, emp.position].filter(Boolean).join(" · ") || "-"}</p>
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(emp.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
