import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseId } from "@/lib/route-id";
import { APPLICATION_KINDS, APPLICATION_STATUS, EVIDENCE_STATUS } from "@/lib/academy-portal";
import { LEVEL_META, isLevel, thaiDate, bangkokDay } from "@/lib/academy";
import { criteriaList } from "@/lib/academy-criteria";
import { autoChecks, LICENCE_LEVELS, STAFF_ROLES, teamCheck } from "@/lib/academy-checks";
import { loadStaff, loadTeams } from "@/lib/academy-data";
import { ResultForm } from "@/components/ResultForm";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { Card, PageBody, PageHeader, btn } from "@/components/academy/ManageUi";
import { AutoCheckBox, DocumentLink, EvidenceStatusChip } from "@/components/academy/EvidenceBits";
import { EvidenceReview } from "@/components/academy/EvidenceReview";
import { Coin, Progress } from "@/components/academy/PortalUi";
import { fieldClass } from "@/components/academy/AcademyShell";
import { approveApplication, passAllPending, rejectApplication, reopenApplication, requestFix } from "../../review-actions";
import { BadgeCheck, CheckCheck, CheckCircle2, Gavel, Info, RotateCcw, Send, ShieldCheck, Shirt, TriangleAlert, Users, XCircle } from "lucide-react";

// ตัวกรองรายการข้อในหน้าตรวจ
const SHOW = {
  all: { label: "ทั้งหมด", match: () => true },
  todo: { label: "รอตรวจ", match: (s: string) => s === "PENDING" },
  fix: { label: "ต้องแก้ / ไม่ผ่าน", match: (s: string) => s === "FIX" || s === "FAIL" },
  pass: { label: "ผ่านแล้ว", match: (s: string) => s === "PASS" },
} as const;
type Show = keyof typeof SHOW;

const BORDER: Record<string, string> = { PENDING: "border-l-slate-300", PASS: "border-l-emerald-500", FIX: "border-l-amber-500", FAIL: "border-l-red-500" };

// คำอธิบายสถานะใบสมัครที่ตรวจไม่ได้แล้ว / ยังตรวจไม่ได้
const STATE_HELP: Record<string, string> = {
  DRAFT: "อคาเดมียังไม่ได้ส่งใบสมัครนี้ — ตรวจได้เมื่ออคาเดมีกดส่งแล้ว",
  NEEDS_FIX: "ส่งกลับให้อคาเดมีแก้ไขแล้ว — รออคาเดมีส่งฉบับแก้ไขกลับมา ใบสมัครจะกลับมาอยู่ในคิว “รอตรวจ” เอง",
  APPROVED: "อนุมัติและออกใบอนุญาตแล้ว — แก้ไขหรือระงับใบอนุญาตได้ที่หน้าอคาเดมี แท็บใบอนุญาต",
  REJECTED: "ไม่อนุมัติแล้ว — อคาเดมีต้องเริ่มใบสมัครใหม่ ถ้าตัดสินผิดกด “เปิดตรวจใหม่” ได้",
};

export default async function ReviewApplicationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ show?: string }> }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) redirect("/academies");
  const id = parseId((await params).id);
  if (!id) notFound();
  const sp = await searchParams;
  const show: Show = sp.show && sp.show in SHOW ? (sp.show as Show) : "all";
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
  const total = app.evidence.length;
  const reviewed = total - tally("PENDING");
  const allPass = tally("PASS") === total;
  const toFix = items.filter((c) => ["FIX", "FAIL"].includes(byCode.get(c.code)!.status));
  const notPassed = items.filter((c) => byCode.get(c.code)!.status !== "PASS");
  const status = APPLICATION_STATUS[app.status];
  const shown = items.filter((c) => SHOW[show].match(byCode.get(c.code)!.status));
  // เปิดกล่องผลการพิจารณาที่น่าจะใช้ไว้ก่อน
  const suggest = allPass ? "approve" : toFix.length ? "fix" : null;
  const count = (k: Show) => items.filter((c) => SHOW[k].match(byCode.get(c.code)!.status)).length;

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
        actions={<span className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ${status.tone}`}>{status.label}</span>}
      />
      <PageBody>
        {/* ความคืบหน้าการตรวจ + วิธีตรวจ */}
        <section className="grid gap-5 rounded-2xl bg-[#1e96dc] p-5 text-[#0b1220] sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="flex items-center gap-4">
            <Coin level={app.level} className="w-16 flex-none" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">ตรวจแล้ว</p>
              <p className="text-3xl font-extrabold">
                {reviewed}
                <span className="text-lg font-bold opacity-70">/{total} ข้อ</span>
              </p>
              <Progress value={reviewed} max={total} className="mt-2 bg-white/40" />
              <p className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold">
                {(["PASS", "FIX", "FAIL", "PENDING"] as const).map((s) => (
                  <span key={s} className={`rounded-md px-2 py-0.5 ${EVIDENCE_STATUS[s].tone}`}>
                    {EVIDENCE_STATUS[s].label} {tally(s)}
                  </span>
                ))}
              </p>
            </div>
          </div>
          {reviewing ? (
            <ol className="grid gap-2 text-sm sm:grid-cols-3">
              {[
                ["ตรวจทีละข้อ", "ดูคำอธิบายและเอกสาร แล้วเลือก ผ่าน / ต้องแก้ไข / ไม่ผ่าน"],
                ["เขียนสิ่งที่ต้องแก้", "ข้อที่ไม่ผ่านให้บอกว่าแก้อะไร อย่างไร แล้วกด “บันทึกผล”"],
                ["ตัดสินผล", "กล่องขวามือ: อนุมัติ · ส่งกลับให้แก้ไข · ไม่อนุมัติ"],
              ].map(([t, d], i) => (
                <li key={t} className="rounded-xl bg-white p-3">
                  <span className="flex items-center gap-2 font-bold">
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#0b1220] text-xs text-[#ffd426]">{i + 1}</span>
                    {t}
                  </span>
                  <span className="mt-1 block text-xs text-slate-600">{d}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="flex items-start gap-2 self-center rounded-xl bg-white p-4 text-sm">
              <Info className="mt-0.5 h-4 w-4 flex-none text-[#1e96dc]" />
              {STATE_HELP[app.status]}
            </p>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="min-w-0 space-y-3">
            <nav aria-label="กรองข้อ" className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
              {(Object.keys(SHOW) as Show[]).map((k) => (
                <Link
                  key={k}
                  href={k === "all" ? `/academies/manage/applications/${app.id}` : `/academies/manage/applications/${app.id}?show=${k}`}
                  aria-current={show === k ? "page" : undefined}
                  className={`inline-flex flex-none items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold ${show === k ? "bg-[#0b1220] text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-[#e6f3fc]"}`}
                >
                  {SHOW[k].label}
                  <span className={`rounded-full px-1.5 text-[11px] font-bold ${show === k ? "bg-white/20" : "bg-slate-100"}`}>{count(k)}</span>
                </Link>
              ))}
            </nav>

            {shown.length === 0 && <p className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 ring-1 ring-slate-200">ไม่มีข้อในกลุ่มนี้</p>}
            {shown.map((c, i) => {
              const e = byCode.get(c.code)!;
              const newCat = i === 0 || shown[i - 1].catNo !== c.catNo;
              return (
                <div key={c.code} className="space-y-3">
                  {newCat && (
                    <h2 className="flex items-center gap-2 pt-2 text-sm font-bold text-[#0b1220]">
                      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-[#0b1220] text-xs text-[#ffd426]">{c.catNo}</span>
                      หมวดที่ {c.catNo} · {c.catTh}
                    </h2>
                  )}
                  <article id={`c-${c.code}`} className={`scroll-mt-24 rounded-2xl border border-l-4 border-slate-200 bg-white p-5 ${BORDER[e.status] ?? BORDER.PENDING}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#0b6cb0]">
                          {c.code} · {c.subTh}
                        </p>
                        <p className="font-semibold text-[#0b1220]">{c.th}</p>
                      </div>
                      <EvidenceStatusChip status={e.status} />
                    </div>

                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-bold text-slate-500">สิ่งที่อคาเดมีส่งมา</p>
                      {auto[c.code] && <AutoCheckBox check={auto[c.code]} />}
                      {e.note && <p className="whitespace-pre-line rounded-xl bg-[#f4f8fc] px-3 py-2 text-sm text-slate-700">{e.note}</p>}
                      {e.documents.length > 0 && (
                        <ul className="space-y-1">
                          {e.documents.map((d) => (
                            <li key={d.id}>
                              <DocumentLink doc={d} />
                            </li>
                          ))}
                        </ul>
                      )}
                      {!auto[c.code] && !e.note && e.documents.length === 0 && (
                        <p className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                          <TriangleAlert className="h-3.5 w-3.5" />
                          อคาเดมีไม่ได้กรอกคำอธิบายและไม่ได้แนบเอกสาร
                        </p>
                      )}
                    </div>

                    {reviewing ? (
                      <EvidenceReview id={e.id} code={c.code} status={e.status} reviewNote={e.reviewNote} />
                    ) : (
                      e.reviewNote && <p className="mt-3 whitespace-pre-line rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">ความเห็นผู้ตรวจ: {e.reviewNote}</p>
                    )}
                    {e.reviewedBy && <p className="mt-1.5 text-[11px] text-slate-400">ตรวจโดย {e.reviewedBy}</p>}
                  </article>
                </div>
              );
            })}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            {reviewing ? (
              <Card title="ผลการพิจารณา" icon={Gavel} tone="ink">
                <div className="space-y-3">
                  {tally("PENDING") > 0 && (
                    <ResultForm action={passAllPending} quiet>
                      <input type="hidden" name="id" value={app.id} />
                      <ConfirmSubmit
                        message={`ให้ผ่านทั้ง ${tally("PENDING")} ข้อที่ยังรอตรวจใช่ไหม? (ข้อที่ตรวจแล้วไม่เปลี่ยน)`}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                      >
                        <CheckCheck className="h-4 w-4" />
                        ผ่านทุกข้อที่ยังรอตรวจ ({tally("PENDING")})
                      </ConfirmSubmit>
                    </ResultForm>
                  )}

                  <details name="decision" open={suggest === "approve"} className="rounded-xl ring-1 ring-emerald-200 open:bg-emerald-50">
                    <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm font-bold text-emerald-800">
                      <ShieldCheck className="h-4 w-4" />
                      อนุมัติและออกใบอนุญาต
                    </summary>
                    <div className="space-y-2 px-3 pb-3">
                      <p className="text-xs text-emerald-900/80">ใช้เมื่อทุกข้อผ่าน — ระบบออกใบอนุญาต FAT {LEVEL_META[app.level].label} ให้ทันที อคาเดมีขึ้นทำเนียบสาธารณะและได้รับแจ้งเตือน</p>
                      {!allPass && (
                        <p className="rounded-lg bg-white px-2.5 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                          ยังผ่านไม่ครบ {notPassed.length} ข้อ: {notPassed.map((c) => c.code).join(", ")}
                        </p>
                      )}
                      <ResultForm action={approveApplication} className="space-y-2">
                        <input type="hidden" name="id" value={app.id} />
                        <label className="block text-xs font-semibold text-slate-600">
                          วันหมดอายุ (ไม่บังคับ)
                          <input name="expiresAt" type="date" min={bangkokDay(new Date())} className={`${fieldClass} mt-1 py-2`} />
                        </label>
                        <label className="block text-xs font-semibold text-slate-600">
                          เลขที่ใบอนุญาต (เว้นว่าง = ออกเลขให้อัตโนมัติ)
                          <input name="licenceNo" className={`${fieldClass} mt-1 py-2`} />
                        </label>
                        {app.level === "GOLD" && (
                          <label className="block text-xs font-semibold text-slate-600">
                            ลีกของสโมสร (T1 / T2 / T3)
                            <input name="tier" placeholder="เช่น T1" className={`${fieldClass} mt-1 py-2`} />
                          </label>
                        )}
                        <textarea name="note" rows={2} placeholder="ข้อความแสดงความยินดีถึงอคาเดมี (ไม่บังคับ)" className={`${fieldClass} py-2`} />
                        <ConfirmSubmit
                          message={`อนุมัติและออกใบอนุญาต FAT ${LEVEL_META[app.level].label} ให้ ${app.academy.nameEn} ใช่ไหม?`}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          อนุมัติ
                        </ConfirmSubmit>
                      </ResultForm>
                    </div>
                  </details>

                  <details name="decision" open={suggest === "fix"} className="rounded-xl ring-1 ring-amber-200 open:bg-amber-50">
                    <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm font-bold text-amber-800">
                      <Send className="h-4 w-4" />
                      ส่งกลับให้แก้ไข ({toFix.length} ข้อ)
                    </summary>
                    <div className="space-y-2 px-3 pb-3">
                      <p className="text-xs text-amber-900/80">ใช้เมื่อมีข้อที่ต้องแก้ — อคาเดมีแก้เฉพาะข้อที่ทำเครื่องหมายไว้ แล้วส่งกลับมาให้ตรวจอีกครั้ง</p>
                      {toFix.length === 0 ? (
                        <p className="rounded-lg bg-white px-2.5 py-2 text-xs text-slate-600 ring-1 ring-amber-200">ยังไม่มีข้อที่ต้องแก้ — เลือก “ต้องแก้ไข” หรือ “ไม่ผ่าน” ที่ข้อนั้นแล้วกดบันทึกผลก่อน</p>
                      ) : (
                        <div className="rounded-lg bg-white p-2.5 ring-1 ring-amber-200">
                          <p className="text-[11px] font-bold text-slate-500">อคาเดมีจะได้รับรายการนี้</p>
                          <ul className="mt-1 space-y-1 text-xs text-slate-700">
                            {toFix.map((c) => (
                              <li key={c.code}>
                                <a href={`#c-${c.code}`} className="font-bold text-amber-800 hover:underline">
                                  ข้อ {c.code}
                                </a>
                                : {byCode.get(c.code)!.reviewNote ?? <span className="text-red-600">ยังไม่ได้เขียนสิ่งที่ต้องแก้</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <ResultForm action={requestFix} className="space-y-2">
                        <input type="hidden" name="id" value={app.id} />
                        <textarea name="note" rows={2} placeholder="ข้อความรวมถึงอคาเดมี (ไม่บังคับ) เช่น กำหนดส่งกลับ" className={`${fieldClass} py-2`} />
                        <button type="submit" className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2.5 text-sm font-bold text-white hover:bg-amber-600">
                          <Send className="h-4 w-4" />
                          ส่งกลับให้แก้ไข
                        </button>
                      </ResultForm>
                    </div>
                  </details>

                  <details name="decision" className="rounded-xl ring-1 ring-red-200 open:bg-red-50">
                    <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm font-bold text-red-700">
                      <XCircle className="h-4 w-4" />
                      ไม่อนุมัติ
                    </summary>
                    <div className="space-y-2 px-3 pb-3">
                      <p className="text-xs text-red-900/80">ใช้เมื่อไม่ผ่านเกณฑ์และไม่ควรแก้ต่อ — ปิดใบสมัครนี้ อคาเดมีต้องเริ่มใบสมัครใหม่</p>
                      <ResultForm action={rejectApplication} className="space-y-2">
                        <input type="hidden" name="id" value={app.id} />
                        <textarea name="note" rows={3} required placeholder="เหตุผล (แจ้งให้อคาเดมีทราบ)" className={`${fieldClass} py-2`} />
                        <ConfirmSubmit message="ยืนยันไม่อนุมัติใบสมัครนี้?" className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-red-700">
                          <XCircle className="h-4 w-4" />
                          ไม่อนุมัติ
                        </ConfirmSubmit>
                      </ResultForm>
                    </div>
                  </details>
                </div>
              </Card>
            ) : (
              <Card title="สถานะใบสมัคร" icon={Gavel} tone="ink">
                <p className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${status.tone}`}>{status.label}</p>
                <p className="mt-2 text-sm text-slate-600">{STATE_HELP[app.status]}</p>
                {app.decidedAt && (
                  <p className="mt-2 text-xs text-slate-500">
                    ตัดสินเมื่อ {thaiDate(app.decidedAt)}
                    {app.decidedBy && ` โดย ${app.decidedBy}`}
                  </p>
                )}
                {app.decisionNote && <p className="mt-3 whitespace-pre-line rounded-xl bg-[#f4f8fc] p-3 text-sm text-slate-700">ข้อความถึงอคาเดมี: {app.decisionNote}</p>}
                {(app.status === "NEEDS_FIX" || app.status === "REJECTED") && (
                  <ResultForm action={reopenApplication} className="mt-3">
                    <input type="hidden" name="id" value={app.id} />
                    <ConfirmSubmit
                      message="เปิดตรวจใบสมัครนี้อีกครั้งใช่ไหม? อคาเดมีจะแก้ไขไม่ได้ระหว่างตรวจ"
                      className={`${btn.secondary} w-full`}
                    >
                      <RotateCcw className="h-4 w-4" />
                      {app.status === "NEEDS_FIX" ? "ดึงกลับมาตรวจต่อ" : "เปิดตรวจใหม่"}
                    </ConfirmSubmit>
                  </ResultForm>
                )}
                {app.status === "APPROVED" && (
                  <Link href={`/academies/manage/${app.academyId}?tab=licences`} className={`${btn.secondary} mt-3 w-full`}>
                    <BadgeCheck className="h-4 w-4" />
                    ดูใบอนุญาต
                  </Link>
                )}
              </Card>
            )}

            <Card title={`บุคลากร (${staff.length})`} icon={Users} tone="violet">
              <ul className="space-y-1.5 text-sm">
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
            </Card>
            <Card title={`ทีม (${teams.length})`} icon={Shirt} tone="emerald">
              <ul className="space-y-1.5 text-sm">
                {teams.map((t) => {
                  const r = teamCheck(t);
                  return (
                    <li key={t.id} className="flex items-center gap-1.5">
                      {r.ok ? <CheckCircle2 className="h-4 w-4 flex-none text-emerald-500" /> : <TriangleAlert className="h-4 w-4 flex-none text-amber-500" />}
                      <span className="text-slate-700">{r.detail}</span>
                    </li>
                  );
                })}
                {teams.length === 0 && <li className="text-slate-400">ยังไม่มีทีม</li>}
              </ul>
              {teams.length > 0 && (
                <Link href={`/academies/manage/${app.academyId}?tab=people`} className={`${btn.link} mt-3 inline-block text-xs`}>
                  ดูรายชื่อนักเตะ
                </Link>
              )}
            </Card>
          </aside>
        </div>
      </PageBody>
    </>
  );
}
