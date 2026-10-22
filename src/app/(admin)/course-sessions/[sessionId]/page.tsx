import { coachName } from "@/lib/coach-name";
import Link from "next/link";
import { parseId } from "@/lib/route-id";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AFC_CERTIFICATE_LEVELS, CORE_LICENSE_PROGRESSION } from "@/lib/constants";
import { getHighestCoreLevel, getNextCoreLevel } from "@/lib/license-rank";
import {
  SESSION_STATUS,
  APPLICATION_STATUS,
  LIVE_APPLICATION_STATUSES,
  certificatePrefix,
  toDateInput,
} from "@/lib/course-workflow";
import { setCourseSessionStatus, deleteCourseSession } from "../actions";
import { ModalTrigger } from "@/components/Modal";
import { SessionForm } from "@/components/course/SessionForm";
import { CopyLinkButton } from "@/components/course/CopyLinkButton";
import { ApplicantsBoard, type ApplicantRow } from "@/components/course/ApplicantsBoard";
import { AddParticipants } from "@/components/course/AddParticipants";
import { ResultsForm, type ResultRow } from "@/components/course/ResultsForm";
import { UndoResultButton } from "@/components/course/UndoResultButton";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  ExternalLink,
  Pencil,
  UserPlus,
  Download,
  IdCard,
  Printer,
  CheckCircle2,
  Trash2,
  Lock,
  Unlock,
  PartyPopper,
  Clock,
} from "lucide-react";

function formatDate(date: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

type Tab = "applicants" | "results" | "certificates";

export default async function CourseSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ tab?: string; created?: string; done?: string; error?: string }>;
}) {
  const { sessionId } = await params;
  const sp = await searchParams;
  const id = parseId(sessionId);
  if (id == null) notFound();

  const session = await prisma.courseSession.findUnique({
    where: { id },
    include: {
      course: true,
      applications: {
        orderBy: { appliedAt: "asc" },
        include: {
          coach: {
            include: {
              licenseRecords: { select: { licenseType: true, certificateNo: true }, orderBy: { issueDate: "desc" } },
            },
          },
          licenseRecord: { select: { id: true, certificateNo: true, issueDate: true, expireDate: true } },
        },
      },
    },
  });
  if (!session) notFound();

  const apps = session.applications;
  const licenseType = session.course.licenseType;
  const isAfc = licenseType != null && AFC_CERTIFICATE_LEVELS.includes(licenseType);
  const n = (status: string) => apps.filter((a) => a.status === status).length;
  const counts = { pending: n("PENDING"), approved: n("APPROVED"), passed: n("PASSED"), failed: n("FAILED") };
  const live = apps.filter((a) => LIVE_APPLICATION_STATUSES.includes(a.status)).length;

  const tab: Tab =
    sp.tab === "applicants" || sp.tab === "results" || sp.tab === "certificates"
      ? sp.tab
      : counts.pending > 0
        ? "applicants"
        : counts.approved > 0
          ? "results"
          : counts.passed > 0
            ? "certificates"
            : "applicants";

  const nameEn = (c: { nameEn: string | null; familyNameEn: string | null }) =>
    [c.nameEn, c.familyNameEn].filter(Boolean).join(" ") || null;
  const printWarnings = (c: { photoUrl: string | null; nameEn: string | null }) => [
    ...(isAfc && !c.photoUrl ? ["ไม่มีรูปถ่าย (บัตรใบอนุญาตจะเป็นกรอบเทา)"] : []),
    ...(licenseType && !c.nameEn ? ["ไม่มีชื่ออังกฤษ (ใบประกาศจะใช้ชื่อไทย)"] : []),
  ];
  const levelBefore = licenseType ? CORE_LICENSE_PROGRESSION[CORE_LICENSE_PROGRESSION.indexOf(licenseType) - 1] : undefined;

  // ---------- ผู้สมัคร ----------
  let applicantRows: ApplicantRow[] = [];
  if (tab === "applicants") {
    // ผู้สมัครที่ยังไม่มีใบอนุญาตในระบบเลย อาจเป็นคนที่มีประวัติเก่าแต่ไม่มีเลขบัตร → หาชื่อ-นามสกุลเดียวกันให้แอดมินรวมได้
    const fresh = apps.filter((a) => a.coach.licenseRecords.length === 0 && ["PENDING", "APPROVED"].includes(a.status));
    const candidates = fresh.length
      ? await prisma.coach.findMany({
          where: {
            OR: fresh.map((a) => ({ nameTh: a.coach.nameTh.trim(), surnameTh: a.coach.surnameTh.trim() })),
            licenseRecords: { some: {} },
            systemUser: null,
          },
          include: { licenseRecords: { select: { licenseType: true, certificateNo: true }, orderBy: { issueDate: "desc" } } },
          take: 200,
        })
      : [];
    const digits = (s: string | null) => (s ? s.replace(/\D/g, "") : null);

    applicantRows = apps.map((a) => {
      const c = a.coach;
      const level = getHighestCoreLevel(c.licenseRecords);
      // คำเตือนมีประโยชน์เฉพาะคนที่ยังไม่ได้ยืนยันผล (คนที่ผ่านแล้วถือระดับนี้อยู่แล้ว)
      const open = ["PENDING", "APPROVED"].includes(a.status);
      const warnings = open ? printWarnings(c) : [];
      if (open && licenseType && getNextCoreLevel(level) !== licenseType) {
        warnings.unshift(
          level ? `ระดับปัจจุบัน ${level} — ไม่ตรงลำดับขั้น` : `ไม่พบใบอนุญาตระดับ ${levelBefore ?? "ก่อนหน้า"} ในระบบ`,
        );
      }
      const matches = candidates
        .filter(
          (m) =>
            m.id !== c.id &&
            m.nameTh.trim() === c.nameTh.trim() &&
            m.surnameTh.trim() === c.surnameTh.trim() &&
            c.licenseRecords.length === 0 &&
            // เลขบัตรมีทั้งคู่แต่ไม่ตรงกัน = คนละคนแน่นอน
            !(digits(m.idNumber) && digits(c.idNumber) && digits(m.idNumber) !== digits(c.idNumber)),
        )
        .map((m) => ({
          coachId: m.id,
          name: coachName(m),
          level: getHighestCoreLevel(m.licenseRecords),
          certificateNo: m.licenseRecords.find((r) => r.certificateNo)?.certificateNo ?? null,
          idTail: digits(m.idNumber)?.slice(-4) ?? null,
        }));
      return {
        id: a.id,
        coachId: c.id,
        status: a.status,
        name: coachName(c),
        nameEn: nameEn(c),
        photoUrl: c.photoUrl,
        idTail: digits(c.idNumber)?.slice(-4) ?? null,
        telNo: c.telNo,
        email: c.email,
        level,
        appliedAt: formatDate(a.appliedAt) ?? "",
        addedByStaff: a.note === "เพิ่มโดยเจ้าหน้าที่",
        warnings,
        matches,
      };
    });
  }

  // ---------- ยืนยันผล ----------
  const byThaiName = <T extends { coach: { nameTh: string; surnameTh: string; nameEn: string | null; familyNameEn: string | null } }>(list: T[]) =>
    [...list].sort((x, y) =>
      coachName(x.coach).localeCompare(coachName(y.coach), "th"),
    );
  let resultRows: ResultRow[] = [];
  let defaultStartNo = "";
  let instructors: { id: number; name: string }[] = [];
  const issueDefault = session.endDate ?? new Date();
  if (tab === "results") {
    resultRows = byThaiName(apps.filter((a) => a.status === "APPROVED")).map((a) => ({
      id: a.id,
      name: coachName(a.coach),
      nameEn: nameEn(a.coach),
      photoUrl: a.coach.photoUrl,
      warnings: printWarnings(a.coach),
    }));
    if (licenseType) {
      // เลขที่ใบประกาศถัดไปของระดับ/ปีนี้ เช่น C-26/0001 (ต่อจากเลขที่มีอยู่แล้วในระบบ)
      const prefix = certificatePrefix(licenseType, issueDefault);
      const used = await prisma.licenseRecord.findMany({
        where: { certificateNo: { startsWith: prefix } },
        select: { certificateNo: true },
      });
      const max = Math.max(0, ...used.map((r) => Number(r.certificateNo!.slice(prefix.length).match(/^\d+/)?.[0] ?? 0)));
      defaultStartNo = `${prefix}${String(max + 1).padStart(4, "0")}`;
    }
    instructors = await prisma.instructor.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  }

  const passedApps = apps
    .filter((a) => a.status === "PASSED")
    .sort((x, y) =>
      (x.licenseRecord?.certificateNo ?? `${x.coach.nameTh}`).localeCompare(y.licenseRecord?.certificateNo ?? `${y.coach.nameTh}`, "th", {
        numeric: true,
      }),
    );
  const failedApps = byThaiName(apps.filter((a) => a.status === "FAILED"));
  const status = SESSION_STATUS[session.status] ?? SESSION_STATUS.CLOSED;
  const issuedCount = apps.filter((a) => a.licenseRecordId != null).length;

  const steps: { key: Tab; no: number; title: string; sub: string; badge?: number }[] = [
    { key: "applicants", no: 1, title: "ผู้สมัคร / อนุมัติ", sub: `${live} คน`, badge: counts.pending },
    { key: "results", no: 2, title: "ยืนยันผลการอบรม", sub: `รอยืนยัน ${counts.approved} คน`, badge: counts.approved },
    {
      key: "certificates",
      no: 3,
      title: licenseType ? "ใบประกาศ / ใบอนุญาต" : "ผู้ผ่านการอบรม",
      sub: `ผ่าน ${counts.passed} คน`,
    },
  ];

  return (
    <div className="space-y-6">
      <Link href="/course-sessions" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        หลักสูตรอบรมทั้งหมด
      </Link>

      {sp.created && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200">
          <PartyPopper className="h-5 w-5" />
          <span className="flex-1 font-medium">เปิดรับสมัครแล้ว — คัดลอกลิงก์ไปประกาศใน Facebook / LINE ได้เลย คนที่ยังไม่มีบัญชีก็สมัครได้</span>
          <CopyLinkButton path={`/apply/${session.id}`} />
        </div>
      )}
      {sp.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{sp.error}</p>}

      {/* หัวรุ่น */}
      <div className="overflow-hidden rounded-2xl bg-linear-to-br from-indigo-950 via-indigo-900 to-indigo-700 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-white/10 text-2xl font-black ring-1 ring-white/20">
            {licenseType ?? "อบรม"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold sm:text-2xl">{session.course.title}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${status.className}`}>{status.label}</span>
            </div>
            <p className="text-indigo-200">{session.name}</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-indigo-100">
              {(session.startDate || session.endDate) && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-amber-300" />
                  อบรม {formatDate(session.startDate)} – {formatDate(session.endDate)}
                </span>
              )}
              {session.venue && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-amber-300" />
                  {session.venue}
                </span>
              )}
              {(session.applicationOpenDate || session.applicationDeadline) && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-300" />
                  รับสมัคร {formatDate(session.applicationOpenDate) ?? "ตอนนี้"} – {formatDate(session.applicationDeadline) ?? "ไม่กำหนด"}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-amber-300" />
                {live}
                {session.capacity != null ? `/${session.capacity}` : ""} คน
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <CopyLinkButton
            path={`/apply/${session.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-bold text-amber-950 hover:bg-amber-300"
          />
          <a
            href={`/apply/${session.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-2 text-xs font-semibold hover:bg-white/20"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            ดูหน้าสมัคร
          </a>
          <ModalTrigger
            label="แก้ไขรายละเอียดรุ่น"
            buttonClassName="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-2 text-xs font-semibold hover:bg-white/20"
            buttonContent={
              <>
                <Pencil className="h-3.5 w-3.5" />
                แก้ไขรุ่น
              </>
            }
          >
            <SessionForm
              defaults={{
                id: session.id,
                name: session.name,
                venue: session.venue ?? "",
                capacity: session.capacity?.toString() ?? "",
                startDate: toDateInput(session.startDate),
                endDate: toDateInput(session.endDate),
                applicationOpenDate: toDateInput(session.applicationOpenDate),
                applicationDeadline: toDateInput(session.applicationDeadline),
              }}
            />
          </ModalTrigger>
          {session.status !== "COMPLETED" && (
            <form action={setCourseSessionStatus}>
              <input type="hidden" name="id" value={session.id} />
              <input type="hidden" name="status" value={session.status === "OPEN" ? "CLOSED" : "OPEN"} />
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-2 text-xs font-semibold hover:bg-white/20">
                {session.status === "OPEN" ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                {session.status === "OPEN" ? "ปิดรับสมัคร" : "เปิดรับสมัครอีกครั้ง"}
              </button>
            </form>
          )}
          {issuedCount === 0 && (
            <ModalTrigger
              label="ลบรุ่นอบรมนี้"
              buttonClassName="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-indigo-200 hover:bg-red-500/20 hover:text-red-100"
              buttonContent={
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  ลบรุ่น
                </>
              }
            >
              <form action={deleteCourseSession} className="space-y-4">
                <input type="hidden" name="id" value={session.id} />
                <p className="text-sm text-slate-600">
                  ลบ &ldquo;{session.name}&rdquo; พร้อมใบสมัครทั้งหมด {apps.length} รายการ — ประวัติผู้ฝึกสอนและบัญชีของผู้สมัครยังอยู่ครบ
                </p>
                <button className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                  <Trash2 className="h-4 w-4" />
                  ยืนยันลบรุ่น
                </button>
              </form>
            </ModalTrigger>
          )}
        </div>
      </div>

      {/* 3 ขั้นตอน */}
      <nav className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="ขั้นตอน">
        {steps.map((s) => {
          const active = tab === s.key;
          return (
            <Link
              key={s.key}
              href={`/course-sessions/${session.id}?tab=${s.key}`}
              aria-current={active ? "page" : undefined}
              className={`relative rounded-2xl border p-3 transition-all sm:p-4 ${
                active
                  ? "border-indigo-600 bg-white shadow-md ring-2 ring-indigo-600"
                  : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {s.no}
              </span>
              <p className={`mt-2 text-sm font-semibold leading-tight ${active ? "text-indigo-900" : "text-slate-700"}`}>{s.title}</p>
              <p className="mt-0.5 text-xs text-slate-400">{s.sub}</p>
              {Boolean(s.badge) && (
                <span className="absolute right-3 top-3 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-950">{s.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {tab === "applicants" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">ติ๊กเลือกหลายคน แล้วกดอนุมัติที่แถบด้านล่างได้ทีเดียว</p>
            <ModalTrigger
              label="เพิ่มผู้เข้าอบรมจากรายชื่อในระบบ"
              buttonClassName="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              buttonContent={
                <>
                  <UserPlus className="h-4 w-4" />
                  เพิ่มผู้เข้าอบรมเอง
                </>
              }
            >
              <AddParticipants sessionId={session.id} />
            </ModalTrigger>
          </div>
          {apps.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <p className="text-sm font-medium text-slate-600">ยังไม่มีผู้สมัคร</p>
              <p className="mt-1 text-xs text-slate-400">คัดลอกลิงก์สมัครด้านบนไปประกาศ หรือกด &ldquo;เพิ่มผู้เข้าอบรมเอง&rdquo;</p>
            </div>
          ) : (
            <ApplicantsBoard sessionId={session.id} rows={applicantRows} />
          )}
        </section>
      )}

      {tab === "results" &&
        (resultRows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-600">ไม่มีผู้เข้าอบรมที่รอยืนยันผล</p>
            <p className="mt-1 text-xs text-slate-400">อนุมัติผู้สมัครในขั้นที่ 1 ก่อน แล้วกลับมายืนยันผลเมื่ออบรมจบ</p>
          </div>
        ) : (
          <section className="space-y-4">
            <p className="text-sm text-slate-500">
              อบรมจบแล้ว ติ๊กออกเฉพาะคนที่ไม่ผ่าน แล้วกดยืนยันครั้งเดียว
              {licenseType && ` — ระบบออกใบอนุญาตระดับ ${licenseType} พร้อมเลขที่ใบประกาศให้ทุกคน ผู้ฝึกสอนดาวน์โหลดเองได้ที่หน้าของตัวเอง`}
            </p>
            <ResultsForm
              sessionId={session.id}
              licenseType={licenseType}
              rows={resultRows}
              defaultIssueDate={toDateInput(issueDefault)}
              defaultStartNo={defaultStartNo}
              instructors={instructors}
            />
          </section>
        ))}

      {tab === "certificates" && (
        <section className="space-y-4">
          {sp.done && (
            <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
              {sp.done}
            </p>
          )}
          {licenseType && passedApps.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Printer className="h-5 w-5 text-indigo-600" />
              <p className="mr-auto text-sm font-semibold text-slate-800">พิมพ์ทั้งรุ่น ({passedApps.length} คน) เป็นไฟล์เดียว</p>
              <a
                href={`/course-sessions/${session.id}/certificates`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Download className="h-4 w-4" />
                Diploma ทั้งรุ่น
              </a>
              {isAfc && (
                <a
                  href={`/course-sessions/${session.id}/certificates?type=licence`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                >
                  <IdCard className="h-4 w-4" />
                  Licence ทั้งรุ่น
                </a>
              )}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3">
              <h2 className="font-semibold text-slate-900">ผ่านการอบรม ({passedApps.length})</h2>
            </div>
            {passedApps.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-slate-400">ยังไม่ได้ยืนยันผล</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {passedApps.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5">
                    <span className="min-w-24 rounded-lg bg-emerald-50 px-2.5 py-1 text-center font-mono text-xs font-semibold text-emerald-700">
                      {a.licenseRecord?.certificateNo ?? "ผ่าน"}
                    </span>
                    {/* จอแคบ: ชื่อเต็มแถว ปุ่มดาวน์โหลดขึ้นบรรทัดใหม่ */}
                    <div className="min-w-44 flex-1">
                      <Link href={`/coaches/${a.coachId}`} className="text-sm font-medium text-slate-900 hover:text-indigo-600">
                        {coachName(a.coach)}
                      </Link>
                      {a.licenseRecord && (
                        <p className="text-xs text-slate-400">
                          ออก {formatDate(a.licenseRecord.issueDate)}
                          {a.licenseRecord.expireDate && ` · หมดอายุ ${formatDate(a.licenseRecord.expireDate)}`}
                        </p>
                      )}
                    </div>
                    {a.licenseRecord && (
                      <div className="ml-auto flex items-center gap-1">
                        <a
                          href={`/coaches/${a.coachId}/certificate/${a.licenseRecord.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Diploma
                        </a>
                        {isAfc && (
                          <a
                            href={`/coaches/${a.coachId}/certificate/${a.licenseRecord.id}?type=licence`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                          >
                            <IdCard className="h-3.5 w-3.5" />
                            Licence
                          </a>
                        )}
                      </div>
                    )}
                    <UndoResultButton sessionId={session.id} applicationId={a.id} name={coachName(a.coach)} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {failedApps.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-3">
                <h2 className="font-semibold text-slate-900">ไม่ผ่านการอบรม ({failedApps.length})</h2>
              </div>
              <ul className="divide-y divide-slate-100">
                {failedApps.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${APPLICATION_STATUS.FAILED.className}`}>
                      {APPLICATION_STATUS.FAILED.label}
                    </span>
                    <Link href={`/coaches/${a.coachId}`} className="flex-1 text-sm font-medium text-slate-900 hover:text-indigo-600">
                      {coachName(a.coach)}
                    </Link>
                    <UndoResultButton sessionId={session.id} applicationId={a.id} name={coachName(a.coach)} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
