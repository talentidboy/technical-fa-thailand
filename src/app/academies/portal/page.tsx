import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAcademy, APPLICATION_KINDS, APPLICATION_STATUS, OPEN_STATUSES } from "@/lib/academy-portal";
import { ACADEMY_LEVELS, LEVEL_META, currentLicence, licenceState, showPublicly, thaiDate } from "@/lib/academy";
import { autoChecks } from "@/lib/academy-checks";
import { loadCheckData } from "@/lib/academy-data";
import { LevelBadge, LevelMedal, StateChip } from "@/components/academy/AcademyUi";
import { ArrowRight, CheckCircle2, Circle, Clock, ExternalLink, FileCheck2, XCircle } from "lucide-react";

export const metadata: Metadata = { title: "พอร์ทัลอคาเดมี | Academy Licensing" };

const AUTO_LABELS: Record<string, string> = {
  "1.1.3": "หัวหน้าอคาเดมี",
  "1.3.1": "ผู้ฝึกสอน",
  "1.6.1": "จำนวนทีม / นักกีฬา",
  "1.6.2": "นักเตะต่อทีม",
};

export default async function AcademyPortalHome() {
  const { member } = await requireAcademy({ approved: false });

  if (member.status !== "APPROVED") {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        {member.status === "PENDING" ? (
          <Clock className="mx-auto h-12 w-12 text-amber-500" />
        ) : (
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
        )}
        <h1 className="mt-4 text-xl font-bold text-slate-900">
          {member.status === "PENDING" ? "รอสมาคมฯ อนุมัติสิทธิ์ดูแลอคาเดมี" : "คำขอสิทธิ์ดูแลอคาเดมีไม่ได้รับอนุมัติ"}
        </h1>
        <p className="mt-2 text-slate-600">
          {member.academy.nameEn}
          {member.academy.province && ` · ${member.academy.province}`}
        </p>
        {member.status === "PENDING" ? (
          <p className="mt-4 text-sm text-slate-500">เมื่อได้รับอนุมัติ คุณจะจัดการข้อมูลอคาเดมีและยื่นใบสมัครได้ทันที — ระหว่างนี้ติดต่อสอบถามฝ่ายเทคนิคของสมาคมฯ ได้</p>
        ) : (
          member.note && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">เหตุผล: {member.note}</p>
        )}
      </section>
    );
  }

  const now = new Date();
  const [academy, check, notices] = await Promise.all([
    prisma.academy.findUniqueOrThrow({
      where: { id: member.academyId },
      include: { licences: true, applications: { orderBy: { createdAt: "desc" }, take: 5, include: { evidence: { select: { status: true } } } }, _count: { select: { staff: true, teams: true } } },
    }),
    loadCheckData(member.academyId),
    prisma.academyNotice.findMany({ where: { academyId: member.academyId }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]);
  const current = currentLicence(academy.licences);
  const state = licenceState(current, now);
  const openApp = academy.applications.find((a) => OPEN_STATUSES.includes(a.status));
  const players = check.teams.reduce((n, t) => n + t.players.length, 0);

  const todo = [
    { done: !!(academy.province && academy.address && (academy.phone || academy.email)), label: "ข้อมูลอคาเดมี (จังหวัด ที่อยู่ ช่องทางติดต่อ)", href: "/academies/portal/profile" },
    { done: check.staff.some((s) => s.role === "HEAD"), label: `บุคลากร — มีหัวหน้าอคาเดมี (${academy._count.staff} คน)`, href: "/academies/portal/staff" },
    { done: academy._count.teams > 0, label: `ทีม (${academy._count.teams} ทีม)`, href: "/academies/portal/teams" },
    { done: players > 0, label: `รายชื่อนักเตะ (${players} คน)`, href: "/academies/portal/teams" },
    { done: !!openApp || state === "active", label: openApp ? `ใบสมัคร: ${APPLICATION_STATUS[openApp.status].label}` : "ยื่นใบสมัคร", href: openApp ? `/academies/portal/applications/${openApp.id}` : "/academies/portal/applications" },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center">
        <LevelMedal level={current?.level ?? null} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {current ? <LevelBadge level={current.level} tier={current.tier} /> : <span className="text-xs font-semibold text-slate-500">ยังไม่มีใบอนุญาต</span>}
            {current && <StateChip state={state} />}
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{academy.nameEn}</h1>
          {academy.nameTh && <p className="text-sm text-slate-500">{academy.nameTh}</p>}
          {current && (
            <p className="mt-1 text-sm text-slate-500">
              อนุมัติ {thaiDate(current.approvedAt)} · มีผลถึง {current.expiresAt ? thaiDate(current.expiresAt) : "ไม่ระบุ"}
            </p>
          )}
        </div>
        {showPublicly(academy.active, state) && (
          <Link href={`/academies/${academy.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <ExternalLink className="h-4 w-4" />
            หน้าสาธารณะ
          </Link>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-semibold text-slate-900">สิ่งที่ต้องทำ</h2>
          <ul className="mt-4 space-y-2">
            {todo.map((t) => (
              <li key={t.label}>
                <Link href={t.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50">
                  {t.done ? <CheckCircle2 className="h-5 w-5 flex-none text-emerald-500" /> : <Circle className="h-5 w-5 flex-none text-slate-300" />}
                  <span className={`flex-1 text-sm ${t.done ? "text-slate-500" : "font-medium text-slate-800"}`}>{t.label}</span>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-semibold text-slate-900">ความพร้อมตามเกณฑ์ที่ระบบตรวจให้</h2>
          <p className="mt-1 text-xs text-slate-500">นับจากรายชื่อบุคลากรและทีมที่กรอกไว้ — เกณฑ์ข้ออื่นตรวจจากเอกสารในใบสมัคร</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="py-1.5 font-medium">เกณฑ์</th>
                  {ACADEMY_LEVELS.map((l) => (
                    <th key={l} className={`py-1.5 text-center font-semibold ${LEVEL_META[l].text}`}>
                      {LEVEL_META[l].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(AUTO_LABELS).map(([code, label]) => (
                  <tr key={code}>
                    <td className="py-2 text-slate-700">
                      {label} <span className="text-xs text-slate-400">({code})</span>
                    </td>
                    {ACADEMY_LEVELS.map((l) => {
                      const r = autoChecks(l, check.staff, check.teams)[code];
                      // บางเกณฑ์ไม่มีในบางระดับ (เช่น Bronze ไม่มีข้อ 1.6.2 ตามเกณฑ์ 2025)
                      if (!r)
                        return (
                          <td key={l} className="py-2 text-center text-slate-300" title="ระดับนี้ไม่มีเกณฑ์ข้อนี้">
                            —
                          </td>
                        );
                      return (
                        <td key={l} className="py-2 text-center" title={r.detail}>
                          {r.ok ? <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" aria-label="ผ่าน" /> : <XCircle className="mx-auto h-5 w-5 text-slate-300" aria-label="ยังไม่ผ่าน" />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">ใบสมัคร</h2>
            <Link href="/academies/portal/applications" className="text-xs font-semibold text-indigo-600 hover:underline">
              ทั้งหมด
            </Link>
          </div>
          {academy.applications.length === 0 ? (
            <Link href="/academies/portal/applications" className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-dashed border-indigo-200 p-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">
              <FileCheck2 className="h-5 w-5" />
              ยื่นใบสมัครขอใบอนุญาต
            </Link>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {academy.applications.map((a) => {
                const reviewed = a.evidence.filter((e) => e.status !== "PENDING").length;
                return (
                  <li key={a.id}>
                    <Link href={`/academies/portal/applications/${a.id}`} className="flex items-center gap-3 py-3 hover:bg-slate-50">
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-slate-800">
                          FAT {LEVEL_META[a.level as keyof typeof LEVEL_META]?.label} · {APPLICATION_KINDS[a.kind]}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {a.submittedAt ? `ส่งเมื่อ ${thaiDate(a.submittedAt)}` : `เริ่มเมื่อ ${thaiDate(a.createdAt)}`} · ตรวจแล้ว {reviewed}/{a.evidence.length} ข้อ
                        </span>
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${APPLICATION_STATUS[a.status].tone}`}>{APPLICATION_STATUS[a.status].label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">การแจ้งเตือนล่าสุด</h2>
            <Link href="/academies/portal/notices" className="text-xs font-semibold text-indigo-600 hover:underline">
              ทั้งหมด
            </Link>
          </div>
          {notices.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">ยังไม่มีการแจ้งเตือน</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {notices.map((n) => (
                <li key={n.id} className="text-sm">
                  <p className={n.readAt ? "text-slate-600" : "font-semibold text-slate-900"}>{n.title}</p>
                  <p className="text-xs text-slate-400">{n.createdAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" })}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
