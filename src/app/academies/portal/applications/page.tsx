import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAcademy, APPLICATION_KINDS, APPLICATION_STATUS, OPEN_STATUSES } from "@/lib/academy-portal";
import { ACADEMY_LEVELS, LEVEL_META, currentLicence, isLevel, levelRank, licenceState, thaiDate } from "@/lib/academy";
import { LEVEL_SUMMARY, criteriaCount } from "@/lib/academy-criteria";
import { ResultForm } from "@/components/ResultForm";
import { LevelMedal } from "@/components/academy/AcademyUi";
import { createApplication } from "../actions";
import { ChevronRight, FilePlus2 } from "lucide-react";

export const metadata: Metadata = { title: "ใบสมัคร | พอร์ทัลอคาเดมี" };

export default async function PortalApplicationsPage() {
  const { member } = await requireAcademy();
  const academy = await prisma.academy.findUniqueOrThrow({
    where: { id: member.academyId },
    include: { licences: true, applications: { orderBy: { createdAt: "desc" }, include: { evidence: { select: { status: true } } } } },
  });
  const current = currentLicence(academy.licences);
  const state = licenceState(current, new Date());
  const holding = current && state !== "revoked" && state !== "expired" && isLevel(current.level) ? current.level : null;
  const open = academy.applications.find((a) => OPEN_STATUSES.includes(a.status));
  const levels = ACADEMY_LEVELS.filter((l) => !holding || levelRank(l) >= levelRank(holding));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">ใบสมัคร</h1>
        <p className="mt-1 text-sm text-slate-500">ขอใบอนุญาตใหม่ ต่ออายุ หรือเลื่อนระดับ — แนบหลักฐานตามเกณฑ์ของระดับที่ขอทีละข้อ แล้วส่งให้สมาคมฯ ตรวจ</p>
      </div>

      {open ? (
        <Link href={`/academies/portal/applications/${open.id}`} className="flex items-center gap-3 rounded-3xl bg-indigo-50 p-5 ring-1 ring-indigo-200 hover:bg-indigo-100">
          <FilePlus2 className="h-6 w-6 text-indigo-600" />
          <span className="flex-1 text-sm text-indigo-900">
            มีใบสมัคร FAT {LEVEL_META[open.level as keyof typeof LEVEL_META]?.label} ที่กำลังดำเนินการ ({APPLICATION_STATUS[open.status].label}) — ทำใบนี้ให้เสร็จก่อนเริ่มใบใหม่
          </span>
          <ChevronRight className="h-5 w-5 text-indigo-400" />
        </Link>
      ) : (
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-semibold text-slate-900">เริ่มใบสมัครใหม่</h2>
          <ResultForm action={createApplication} className="mt-4">
            <div role="radiogroup" className="grid gap-3 md:grid-cols-3">
              {levels.map((l, i) => (
                <label key={l} className="relative flex cursor-pointer gap-3 rounded-2xl p-4 ring-2 ring-slate-200 has-checked:bg-indigo-50 has-checked:ring-indigo-500">
                  <input type="radio" name="level" value={l} required defaultChecked={i === 0} className="sr-only" />
                  <LevelMedal level={l} size="sm" />
                  <span>
                    <span className={`block font-bold ${LEVEL_META[l].text}`}>{LEVEL_SUMMARY[l].title}</span>
                    <span className="block text-xs text-slate-500">
                      {!holding ? "ขอใบอนุญาตใหม่" : l === holding ? "ต่ออายุ" : "เลื่อนระดับ"} · {criteriaCount(l)} ข้อ
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">{LEVEL_SUMMARY[l].audience.th}</span>
                  </span>
                </label>
              ))}
            </div>
            <button type="submit" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800">
              <FilePlus2 className="h-4 w-4" />
              เริ่มใบสมัคร
            </button>
          </ResultForm>
        </section>
      )}

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <h2 className="border-b border-slate-100 px-6 py-3.5 font-semibold text-slate-900">ประวัติใบสมัคร</h2>
        {academy.applications.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">ยังไม่มีใบสมัคร</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {academy.applications.map((a) => (
              <li key={a.id}>
                <Link href={`/academies/portal/applications/${a.id}`} className="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50">
                  <LevelMedal level={a.level} size="sm" />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-slate-800">
                      FAT {LEVEL_META[a.level as keyof typeof LEVEL_META]?.label} · {APPLICATION_KINDS[a.kind]}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {a.submittedAt ? `ส่งเมื่อ ${thaiDate(a.submittedAt)}` : `เริ่มเมื่อ ${thaiDate(a.createdAt)}`}
                      {a.decidedAt && ` · ตัดสินเมื่อ ${thaiDate(a.decidedAt)}`}
                    </span>
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${APPLICATION_STATUS[a.status].tone}`}>{APPLICATION_STATUS[a.status].label}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
