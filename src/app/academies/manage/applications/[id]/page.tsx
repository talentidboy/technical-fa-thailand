import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseId } from "@/lib/route-id";
import { APPLICATION_KINDS, APPLICATION_STATUS } from "@/lib/academy-portal";
import { LEVEL_META, isLevel, thaiDate, bangkokDay } from "@/lib/academy";
import { criteriaList } from "@/lib/academy-criteria";
import { autoChecks, LICENCE_LEVELS, STAFF_ROLES, teamCheck } from "@/lib/academy-checks";
import { loadStaff, loadTeams } from "@/lib/academy-data";
import { ResultForm } from "@/components/ResultForm";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { PageBody, PageHeader } from "@/components/academy/ManageUi";
import { AutoCheckBox, DocumentLink, EvidenceStatusChip } from "@/components/academy/EvidenceBits";
import { fieldClass } from "@/components/academy/AcademyShell";
import { approveApplication, passAllPending, rejectApplication, requestFix, reviewEvidence } from "../../review-actions";
import { BadgeCheck, CheckCheck, CheckCircle2, Save, Send, ShieldCheck, TriangleAlert, XCircle } from "lucide-react";

const REVIEW_OPTIONS = [
  { value: "PASS", label: "ผ่าน", tone: "has-checked:bg-emerald-600 has-checked:text-white has-checked:ring-emerald-600" },
  { value: "FIX", label: "ต้องแก้ไข", tone: "has-checked:bg-amber-500 has-checked:text-white has-checked:ring-amber-500" },
  { value: "FAIL", label: "ไม่ผ่าน", tone: "has-checked:bg-red-600 has-checked:text-white has-checked:ring-red-600" },
];

export default async function ReviewApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) redirect("/academies");
  const id = parseId((await params).id);
  if (!id) notFound();
  const app = await prisma.academyApplication.findUnique({
    where: { id },
    include: { academy: true, evidence: { include: { documents: { orderBy: { id: "asc" } } } } },
  });
  if (!app || !isLevel(app.level)) notFound();

  const [staff, teams] = await Promise.all([loadStaff(app.academyId), loadTeams(app.academyId)]);
  const auto = autoChecks(
    app.level,
    staff.map((s) => ({ name: s.name, role: s.role, licence: s.licence, verifiedLicence: s.verifiedLicence })),
    teams.map((t) => ({ name: t.name, ageGroup: t.ageGroup, players: t.players })),
  );
  const byCode = new Map(app.evidence.map((e) => [e.criterion, e]));
  const items = criteriaList(app.level).filter((c) => byCode.has(c.code));
  const reviewing = app.status === "SUBMITTED";
  const tally = (s: string) => app.evidence.filter((e) => e.status === s).length;
  const allPass = tally("PASS") === app.evidence.length;
  const status = APPLICATION_STATUS[app.status];

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/academies/manage/applications", label: "ใบสมัคร" }]}
        title={
          <Link href={`/academies/manage/${app.academyId}`} className="hover:underline">
            {app.academy.nameEn}
          </Link>
        }
        description={
          <>
            FAT {LEVEL_META[app.level].label} · {APPLICATION_KINDS[app.kind]}
            {app.academy.province && ` · ${app.academy.province}`}
            {app.submittedAt && ` · ส่ง ${thaiDate(app.submittedAt)}`}
          </>
        }
        actions={
          <>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ${status.tone}`}>{status.label}</span>
            {[
              ["PASS", "ผ่าน", "bg-emerald-50 text-emerald-700"],
              ["FIX", "แก้ไข", "bg-amber-50 text-amber-700"],
              ["FAIL", "ไม่ผ่าน", "bg-red-50 text-red-700"],
              ["PENDING", "รอตรวจ", "bg-slate-100 text-slate-600"],
            ].map(([st, l, tone]) => (
              <span key={st} className={`rounded-md px-2.5 py-1 text-xs font-semibold ${tone}`}>
                {l} {tally(st)}
              </span>
            ))}
          </>
        }
      />
      <PageBody>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-3">
            {items.map((c) => {
              const e = byCode.get(c.code)!;
              return (
                <article key={c.code} id={`c-${c.code}`} className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-400">
                        {c.code} · {c.catTh} · {c.subTh}
                      </p>
                      <p className="font-semibold text-slate-900">{c.th}</p>
                    </div>
                    <EvidenceStatusChip status={e.status} />
                  </div>
                  {auto[c.code] && <AutoCheckBox check={auto[c.code]} />}
                  {e.note ? (
                    <p className="mt-2 whitespace-pre-line rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{e.note}</p>
                  ) : (
                    !auto[c.code] && e.documents.length === 0 && <p className="mt-2 text-xs text-slate-400">อคาเดมีไม่ได้กรอกคำอธิบาย</p>
                  )}
                  {e.documents.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {e.documents.map((d) => (
                        <li key={d.id}>
                          <DocumentLink doc={d} />
                        </li>
                      ))}
                    </ul>
                  )}
                  {reviewing ? (
                    <ResultForm action={reviewEvidence} quiet className="mt-3 flex flex-wrap items-start gap-2 border-t border-slate-100 pt-3">
                      <input type="hidden" name="id" value={e.id} />
                      <div role="radiogroup" aria-label={`ผลตรวจข้อ ${c.code}`} className="flex gap-1">
                        {REVIEW_OPTIONS.map((o) => (
                          <label key={o.value} className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 ${o.tone}`}>
                            <input type="radio" name="status" value={o.value} defaultChecked={e.status === o.value} className="sr-only" />
                            {o.label}
                          </label>
                        ))}
                      </div>
                      <input name="reviewNote" defaultValue={e.reviewNote ?? ""} placeholder="ความเห็น / สิ่งที่ต้องแก้ไข" className={`${fieldClass} min-w-48 flex-1 py-1.5`} />
                      <button type="submit" aria-label={`บันทึกผลข้อ ${c.code}`} className="inline-flex items-center gap-1 rounded-lg bg-[#0b1f44] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#162d5c]">
                        <Save className="h-3.5 w-3.5" />
                        บันทึก
                      </button>
                    </ResultForm>
                  ) : (
                    e.reviewNote && <p className="mt-2 text-xs text-amber-800">ความเห็น: {e.reviewNote}</p>
                  )}
                  {e.reviewedBy && <p className="mt-1 text-[11px] text-slate-400">ตรวจโดย {e.reviewedBy}</p>}
                </article>
              );
            })}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            {reviewing && (
              <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="font-semibold text-slate-900">ผลการพิจารณา</h2>
                <ResultForm action={passAllPending} quiet>
                  <input type="hidden" name="id" value={app.id} />
                  <button type="submit" className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                    <CheckCheck className="h-4 w-4" />
                    ผ่านทุกข้อที่ยังรอตรวจ ({tally("PENDING")})
                  </button>
                </ResultForm>
                <details className="rounded-xl bg-emerald-50 p-3" open={allPass}>
                  <summary className="cursor-pointer text-sm font-semibold text-emerald-800">อนุมัติและออกใบอนุญาต</summary>
                  <ResultForm action={approveApplication} className="mt-3 space-y-2">
                    <input type="hidden" name="id" value={app.id} />
                    <label className="block text-xs text-slate-600">
                      วันหมดอายุ (ไม่บังคับ)
                      <input name="expiresAt" type="date" min={bangkokDay(new Date())} className={`${fieldClass} mt-1`} />
                    </label>
                    <label className="block text-xs text-slate-600">
                      เลขที่ใบอนุญาต (ไม่บังคับ)
                      <input name="licenceNo" className={`${fieldClass} mt-1`} />
                    </label>
                    {app.level === "GOLD" && (
                      <label className="block text-xs text-slate-600">
                        ลีกของสโมสร (T1 / T2 / T3)
                        <input name="tier" placeholder="เช่น T1" className={`${fieldClass} mt-1`} />
                      </label>
                    )}
                    <textarea name="note" rows={2} placeholder="ข้อความถึงอคาเดมี" className={fieldClass} />
                    <ConfirmSubmit
                      message={`อนุมัติและออกใบอนุญาต FAT ${LEVEL_META[app.level].label} ให้ ${app.academy.nameEn} ใช่ไหม?`}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      อนุมัติ
                    </ConfirmSubmit>
                    {!allPass && <p className="text-xs text-emerald-800">ต้องตรวจให้ผ่านครบทุกข้อก่อน</p>}
                  </ResultForm>
                </details>
                <details className="rounded-xl bg-amber-50 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-amber-800">ส่งกลับให้แก้ไข ({tally("FIX") + tally("FAIL")} ข้อ)</summary>
                  <ResultForm action={requestFix} className="mt-3 space-y-2">
                    <input type="hidden" name="id" value={app.id} />
                    <textarea name="note" rows={2} placeholder="ข้อความถึงอคาเดมี (ไม่บังคับ)" className={fieldClass} />
                    <button type="submit" className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600">
                      <Send className="h-4 w-4" />
                      ส่งกลับให้แก้ไข
                    </button>
                  </ResultForm>
                </details>
                <details className="rounded-xl bg-red-50 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-red-700">ไม่อนุมัติ</summary>
                  <ResultForm action={rejectApplication} className="mt-3 space-y-2">
                    <input type="hidden" name="id" value={app.id} />
                    <textarea name="note" rows={2} required placeholder="เหตุผล (แจ้งให้อคาเดมีทราบ)" className={fieldClass} />
                    <ConfirmSubmit message="ยืนยันไม่อนุมัติใบสมัครนี้?" className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">
                      <XCircle className="h-4 w-4" />
                      ไม่อนุมัติ
                    </ConfirmSubmit>
                  </ResultForm>
                </details>
              </section>
            )}
            {app.decisionNote && <p className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">หมายเหตุการตัดสิน: {app.decisionNote}</p>}

            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">บุคลากร ({staff.length})</h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {staff.map((s) => (
                  <li key={s.id} className="flex items-center gap-1.5">
                    <span className="min-w-0 flex-1 truncate text-slate-700">
                      {s.name} <span className="text-xs text-slate-400">· {STAFF_ROLES[s.role] ?? s.role}</span>
                    </span>
                    {s.verifiedLicence ? (
                      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-700" title="ยืนยันจากฐานข้อมูลผู้ฝึกสอน">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        {LICENCE_LEVELS[s.verifiedLicence]}
                      </span>
                    ) : (
                      s.licence && <span className="text-xs text-slate-500">แจ้ง {LICENCE_LEVELS[s.licence] ?? s.licence}</span>
                    )}
                  </li>
                ))}
                {staff.length === 0 && <li className="text-slate-400">ยังไม่มีรายชื่อ</li>}
              </ul>
            </section>
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">ทีม ({teams.length})</h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {teams.map((t) => {
                  const r = teamCheck(t);
                  return (
                    <li key={t.id} className="flex items-center gap-1.5">
                      {r.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <TriangleAlert className="h-4 w-4 text-amber-500" />}
                      <span className="text-slate-700">{r.detail}</span>
                    </li>
                  );
                })}
                {teams.length === 0 && <li className="text-slate-400">ยังไม่มีทีม</li>}
              </ul>
              {teams.length > 0 && (
                <Link href={`/academies/manage/${app.academyId}#teams`} className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:underline">
                  ดูรายชื่อนักเตะ
                </Link>
              )}
            </section>
          </aside>
        </div>
      </PageBody>
    </>
  );
}
