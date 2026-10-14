import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SESSION_STATUS } from "@/lib/course-workflow";
import { ModalTrigger } from "@/components/Modal";
import { SessionForm } from "@/components/course/SessionForm";
import { CopyLinkButton } from "@/components/course/CopyLinkButton";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Plus,
  Megaphone,
  UserCheck,
  BadgeCheck,
  BookOpen,
  AlertCircle,
} from "lucide-react";

function formatDate(date: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

const STEPS = [
  { icon: Megaphone, title: "เปิดรับสมัคร", text: "เลือกระดับ ใส่วันที่ แล้วคัดลอกลิงก์ไปประกาศ — คนที่ยังไม่มีบัญชีก็สมัครได้" },
  { icon: UserCheck, title: "อนุมัติผู้เข้าอบรม", text: "ติ๊กเลือกหลายคนแล้วกดอนุมัติทีเดียว หรือเพิ่มชื่อเองจากในระบบ" },
  { icon: BadgeCheck, title: "ยืนยันผลผ่าน", text: "อบรมจบ ติ๊กคนที่ผ่าน กดครั้งเดียว ระบบออกใบอนุญาต + เลขที่ใบประกาศให้ทุกคน" },
];

export default async function AdminCoursesPage() {
  const [sessions, counts, generalCourses] = await Promise.all([
    prisma.courseSession.findMany({
      include: { course: true },
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.application.groupBy({ by: ["courseSessionId", "status"], _count: true }),
    prisma.course.findMany({ where: { courseType: "GENERAL" }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);

  const countOf = (sessionId: number, status: string) =>
    counts.find((c) => c.courseSessionId === sessionId && c.status === status)?._count ?? 0;

  const now = new Date();
  const buddhistYear = now.getFullYear() + 543;
  const active = sessions.filter((s) => s.status !== "COMPLETED");
  const done = sessions.filter((s) => s.status === "COMPLETED");

  const card = (s: (typeof sessions)[number]) => {
    const pending = countOf(s.id, "PENDING");
    const approved = countOf(s.id, "APPROVED");
    const passed = countOf(s.id, "PASSED");
    const isGeneral = s.course.courseType === "GENERAL";
    const ended = s.endDate != null && s.endDate < now;
    const status = SESSION_STATUS[s.status] ?? SESSION_STATUS.CLOSED;
    // ขั้นตอนถัดไปที่ควรทำ — ให้แอดมินรู้ทันทีว่ารุ่นไหนรออะไรอยู่
    const hint =
      pending > 0
        ? { text: `มีผู้สมัครรออนุมัติ ${pending} คน`, tone: "bg-amber-50 text-amber-800 ring-amber-200" }
        : approved > 0 && ended
          ? { text: `อบรมจบแล้ว — รอยืนยันผล ${approved} คน`, tone: "bg-indigo-50 text-indigo-800 ring-indigo-200" }
          : null;

    return (
      <li key={s.id}>
        <Link
          href={`/course-sessions/${s.id}`}
          className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:flex-row sm:items-center"
        >
          <div
            className={`flex h-14 w-14 flex-none items-center justify-center rounded-2xl text-xl font-black ${
              isGeneral ? "bg-slate-100 text-slate-500" : "bg-linear-to-br from-indigo-700 to-indigo-500 text-white shadow-sm shadow-indigo-200"
            }`}
          >
            {isGeneral ? <BookOpen className="h-6 w-6" /> : s.course.licenseType}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-900">{s.course.title}</p>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${status.className}`}>{status.label}</span>
            </div>
            <p className="text-sm text-slate-500">{s.name}</p>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {(s.startDate || s.endDate) && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(s.startDate)} – {formatDate(s.endDate)}
                </span>
              )}
              {s.venue && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {s.venue}
                </span>
              )}
            </div>
            {hint && (
              <p className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${hint.tone}`}>
                <AlertCircle className="h-3.5 w-3.5" />
                {hint.text}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 sm:gap-5">
            {[
              { n: pending, label: "รออนุมัติ", tone: pending ? "text-amber-600" : "text-slate-300" },
              { n: approved, label: "เข้าอบรม", tone: approved ? "text-sky-600" : "text-slate-300" },
              { n: passed, label: "ผ่าน", tone: passed ? "text-emerald-600" : "text-slate-300" },
            ].map((x) => (
              <div key={x.label} className="text-center">
                <p className={`text-2xl font-black tabular-nums leading-none ${x.tone}`}>{x.n}</p>
                <p className="mt-1 text-[11px] text-slate-400">{x.label}</p>
              </div>
            ))}
            <ArrowRight className="ml-1 hidden h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500 sm:block" />
          </div>
        </Link>
      </li>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">หลักสูตรอบรม</h1>
          <p className="mt-1 text-sm text-slate-500">เปิดรุ่น → อนุมัติผู้เข้าอบรม → ยืนยันผล ระบบออกใบอนุญาตให้ทั้งรุ่นอัตโนมัติ</p>
        </div>
        <ModalTrigger
          label="เปิดรุ่นอบรมใหม่"
          buttonClassName="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
          buttonContent={
            <>
              <Plus className="h-4 w-4" />
              เปิดรุ่นอบรมใหม่
            </>
          }
        >
          <SessionForm generalCourses={generalCourses} suggestedName={`รุ่นที่ 1/${buddhistYear}`} />
        </ModalTrigger>
      </div>

      <ol className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {i + 1}. {title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{text}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500">กำลังดำเนินการ ({active.length})</h2>
        {active.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <p className="text-sm text-slate-500">ยังไม่มีรุ่นที่กำลังเปิด</p>
            <p className="mt-1 text-xs text-slate-400">กด &ldquo;เปิดรุ่นอบรมใหม่&rdquo; ด้านบนเพื่อเริ่มรับสมัคร</p>
          </div>
        ) : (
          <ul className="space-y-3">{active.map(card)}</ul>
        )}
      </section>

      {done.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500">จบรุ่นแล้ว ({done.length})</h2>
          <ul className="space-y-3">{done.map(card)}</ul>
        </section>
      )}

      {active.some((s) => s.status === "OPEN") && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-indigo-950 p-5 text-indigo-100">
          <Megaphone className="h-5 w-5 text-amber-300" />
          <p className="flex-1 text-sm">ลิงก์รวมรุ่นที่เปิดรับสมัครทั้งหมด สำหรับประกาศ</p>
          <CopyLinkButton
            path="/coach-center"
            label="คัดลอกลิงก์"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
          />
        </div>
      )}
    </div>
  );
}
