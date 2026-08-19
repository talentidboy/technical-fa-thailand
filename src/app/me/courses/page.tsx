import Link from "next/link";
import { requireCoach } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHighestCoreLevel, getNextCoreLevel } from "@/lib/license-rank";
import { applyToSession } from "./actions";
import { CalendarDays, MapPin, Lock, CheckCircle2, Clock } from "lucide-react";

function formatDate(date: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

const APP_STATUS_LABEL: Record<string, { label: string; className: string }> = {
  PENDING: { label: "รอตรวจสอบ", className: "bg-amber-50 text-amber-600" },
  APPROVED: { label: "อนุมัติแล้ว", className: "bg-emerald-50 text-emerald-600" },
  REJECTED: { label: "ไม่ผ่าน", className: "bg-red-50 text-red-600" },
  CANCELLED: { label: "ยกเลิก", className: "bg-slate-100 text-slate-500" },
};

export default async function MyCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; applied?: string }>;
}) {
  const user = await requireCoach();
  const coachId = user.coachId!;
  const { error, applied } = await searchParams;

  const [licenseRecords, sessions, myApplications] = await Promise.all([
    prisma.licenseRecord.findMany({
      where: { coachId },
      select: { licenseType: true, expireDate: true, issueDate: true },
    }),
    prisma.courseSession.findMany({
      where: { status: "OPEN" },
      include: { course: true, _count: { select: { applications: true } } },
      orderBy: { startDate: "asc" },
    }),
    prisma.application.findMany({
      where: { coachId },
      include: { courseSession: { include: { course: true } } },
      orderBy: { appliedAt: "desc" },
    }),
  ]);

  const currentLevel = getHighestCoreLevel(licenseRecords);
  const nextLevel = getNextCoreLevel(currentLevel);
  const appliedSessionIds = new Set(
    myApplications
      .filter((a) => a.status === "PENDING" || a.status === "APPROVED")
      .map((a) => a.courseSessionId),
  );

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">สมัครเข้าอบรม</h1>
        <p className="mt-1 text-sm text-slate-500">
          {currentLevel
            ? `ระดับปัจจุบันของคุณ: ${currentLevel}`
            : "คุณยังไม่มีใบอนุญาต — เริ่มจากระดับ G"}
          {nextLevel ? ` · สมัครได้ต่อไปที่ระดับ ${nextLevel}` : " · คุณผ่านระดับสูงสุดแล้ว"}
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}
      {applied && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
          ส่งใบสมัครแล้ว รอแอดมินตรวจสอบ
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">รุ่นอบรมที่เปิดรับสมัคร</h2>
        </div>
        {sessions.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-400">
            ยังไม่มีรุ่นอบรมที่เปิดรับสมัครในขณะนี้
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sessions.map((session) => {
              const eligible = session.course.licenseType === nextLevel;
              const alreadyApplied = appliedSessionIds.has(session.id);
              const full =
                session.capacity != null &&
                session._count.applications >= session.capacity;
              const deadlinePassed =
                session.applicationDeadline != null &&
                session.applicationDeadline < new Date();
              const notYetOpen =
                session.applicationOpenDate != null &&
                session.applicationOpenDate > new Date();
              const canApply =
                eligible && !alreadyApplied && !full && !deadlinePassed && !notYetOpen;

              return (
                <li key={session.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      {session.course.title}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        ({session.course.licenseType}) · {session.name}
                      </span>
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      {(session.startDate || session.endDate) && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(session.startDate)} - {formatDate(session.endDate)}
                        </span>
                      )}
                      {session.venue && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {session.venue}
                        </span>
                      )}
                      {session.capacity != null && (
                        <span>
                          รับ {session._count.applications}/{session.capacity} คน
                        </span>
                      )}
                    </div>
                    {(session.applicationOpenDate || session.applicationDeadline) && (
                      <p className="mt-1 text-xs text-slate-400">
                        รับสมัคร {formatDate(session.applicationOpenDate) ?? "วันนี้"} -{" "}
                        {formatDate(session.applicationDeadline) ?? "ไม่กำหนด"}
                      </p>
                    )}
                  </div>

                  {alreadyApplied ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      สมัครแล้ว
                    </span>
                  ) : canApply ? (
                    <form action={applyToSession}>
                      <input type="hidden" name="courseSessionId" value={session.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700"
                      >
                        สมัคร
                      </button>
                    </form>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
                      {!eligible && <Lock className="h-3.5 w-3.5" />}
                      {!eligible
                        ? `ต้องผ่านระดับก่อนหน้าก่อน`
                        : full
                          ? "เต็มแล้ว"
                          : notYetOpen
                            ? "ยังไม่เปิดรับสมัคร"
                            : deadlinePassed
                              ? "หมดเขตสมัคร"
                              : "สมัครไม่ได้"}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Clock className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-slate-900">ใบสมัครของฉัน</h2>
        </div>
        {myApplications.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">
            ยังไม่มีประวัติการสมัคร
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {myApplications.map((app) => {
              const style = APP_STATUS_LABEL[app.status];
              return (
                <li key={app.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {app.courseSession.course.title} · {app.courseSession.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      สมัครเมื่อ {formatDate(app.appliedAt)}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${style.className}`}>
                    {style.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Link
        href="/me"
        className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        ← กลับไปหน้าโปรไฟล์
      </Link>
    </div>
  );
}
