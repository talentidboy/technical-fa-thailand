import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { parseId } from "@/lib/route-id";
import { requireAcademy, APPLICATION_KINDS, APPLICATION_STATUS, EDITABLE_STATUSES } from "@/lib/academy-portal";
import { LEVEL_META, isLevel, thaiDate } from "@/lib/academy";
import { criteriaList } from "@/lib/academy-criteria";
import { autoChecks } from "@/lib/academy-checks";
import { loadCheckData } from "@/lib/academy-data";
import { docsEnabled, DOC_ACCEPT } from "@/lib/academy-docs";
import { ResultForm } from "@/components/ResultForm";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { Coin, Progress } from "@/components/academy/PortalUi";
import { academyPoster } from "@/components/typefaces/academy";
import { AutoCheckBox, DocumentLink, EvidenceStatusChip } from "@/components/academy/EvidenceBits";
import { fieldClass } from "@/components/academy/AcademyShell";
import { deleteDocument, deleteDraft, saveEvidence, submitApplication } from "../../actions";
import { ArrowLeft, MessageSquareWarning, Save, Send, Trash2, TriangleAlert } from "lucide-react";

export const metadata: Metadata = { title: "ใบสมัคร | พอร์ทัลอคาเดมี" };

export default async function PortalApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { member } = await requireAcademy();
  const id = parseId((await params).id);
  if (!id) notFound();
  const app = await prisma.academyApplication.findFirst({
    where: { id, academyId: member.academyId },
    include: { evidence: { include: { documents: { orderBy: { id: "asc" } } } } },
  });
  if (!app || !isLevel(app.level)) notFound();

  const editable = EDITABLE_STATUSES.includes(app.status);
  const check = await loadCheckData(member.academyId);
  const auto = autoChecks(app.level, check.staff, check.teams);
  const byCode = new Map(app.evidence.map((e) => [e.criterion, e]));
  const items = criteriaList(app.level).filter((c) => byCode.has(c.code));
  const filled = items.filter((c) => {
    const e = byCode.get(c.code)!;
    return c.code in auto || e.note || e.documents.length > 0;
  }).length;
  const canUpload = docsEnabled();
  const status = APPLICATION_STATUS[app.status];

  return (
    <div className="space-y-6">
      <Link href="/academies/portal/applications" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0b6cb0] hover:underline">
        <ArrowLeft className="h-4 w-4" />
        ใบสมัครทั้งหมด
      </Link>

      <section className="rounded-3xl border-t-4 border-t-[#1e96dc] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          <Coin level={app.level} className="w-16 flex-none" />
          <div className="min-w-0 flex-1">
            <h1 className={`${academyPoster.className} text-2xl font-bold text-[#0b1220]`}>
              FAT {LEVEL_META[app.level].label} Level Academy · {APPLICATION_KINDS[app.kind]}
            </h1>
            <p className="text-sm text-slate-500">
              เริ่ม {thaiDate(app.createdAt)}
              {app.submittedAt && ` · ส่งล่าสุด ${thaiDate(app.submittedAt)}`}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ${status.tone}`}>{status.label}</span>
        </div>
        <div className="mt-5">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-[#0b1220]">
              กรอกแล้ว {filled}/{items.length} ข้อ
            </span>
            <span className="font-bold text-[#0b6cb0]">{Math.round((filled / items.length) * 100)}%</span>
          </div>
          <Progress value={filled} max={items.length} className="mt-1.5" />
        </div>
        {app.decisionNote && (
          <p className={`mt-4 flex gap-2 rounded-xl p-3 text-sm ${app.status === "APPROVED" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
            <MessageSquareWarning className="mt-0.5 h-4 w-4 flex-none" />
            {app.decisionNote}
          </p>
        )}
        {editable && !canUpload && (
          <p className="mt-4 flex gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            <TriangleAlert className="mt-0.5 h-4 w-4 flex-none text-amber-500" />
            ระบบแนบเอกสารยังไม่เปิดใช้งาน — กรอกคำอธิบายไว้ก่อนได้ แล้วกลับมาแนบเอกสารเมื่อระบบพร้อม
          </p>
        )}
      </section>

      {[1, 2, 3].map((catNo) => {
        const catItems = items.filter((c) => c.catNo === catNo);
        if (!catItems.length) return null;
        return (
          <section key={catNo} className="space-y-3">
            <h2 className="flex items-center gap-2 pt-2 text-base font-bold text-[#0b1220]">
              <span className={`${academyPoster.className} flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#0b1220] text-sm text-[#ffd426]`}>{catNo}</span>
              หมวดที่ {catNo} · {catItems[0].catTh}
            </h2>
            {catItems.map((c) => {
              const e = byCode.get(c.code)!;
              const highlight = e.status === "FIX" || e.status === "FAIL";
              return (
                <article key={c.code} id={`c-${c.code}`} className={`scroll-mt-24 rounded-2xl border border-l-4 bg-white p-5 shadow-[0_1px_2px_rgb(15_23_42/0.04)] ${highlight ? "border-amber-300 border-l-amber-500" : "border-slate-200 border-l-[#1e96dc]"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#0b6cb0]">
                        {c.code} · {c.subTh}
                      </p>
                      <p className="font-semibold text-[#0b1220]">{c.th}</p>
                      <p className="text-xs text-slate-400">{c.en}</p>
                    </div>
                    {app.status !== "DRAFT" && <EvidenceStatusChip status={e.status} />}
                  </div>
                  {auto[c.code] && <AutoCheckBox check={auto[c.code]} />}
                  {e.reviewNote && (
                    <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      <span className="font-semibold">ความเห็นจากสมาคมฯ: </span>
                      {e.reviewNote}
                    </p>
                  )}
                  {e.documents.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {e.documents.map((d) => (
                        <li key={d.id} className="flex items-center gap-2">
                          <DocumentLink doc={d} />
                          {editable && (
                            <ResultForm action={deleteDocument} quiet>
                              <input type="hidden" name="id" value={d.id} />
                              <ConfirmSubmit message={`ลบไฟล์ ${d.fileName} ใช่ไหม?`} ariaLabel={`ลบไฟล์ ${d.fileName}`} className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="h-3.5 w-3.5" />
                              </ConfirmSubmit>
                            </ResultForm>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {editable ? (
                    <ResultForm action={saveEvidence} className="mt-3 space-y-2">
                      <input type="hidden" name="id" value={e.id} />
                      <textarea
                        name="note"
                        rows={2}
                        defaultValue={e.note ?? ""}
                        placeholder={c.code in auto ? "คำอธิบายเพิ่มเติม (ไม่บังคับ — ระบบตรวจจากข้อมูลบุคลากร/ทีมให้แล้ว)" : "อธิบายสิ่งที่อคาเดมีมีตามเกณฑ์ข้อนี้ และ/หรือแนบเอกสาร"}
                        className={fieldClass}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        {canUpload && (
                          <input
                            name="files"
                            type="file"
                            multiple
                            accept={DOC_ACCEPT}
                            aria-label={`แนบเอกสารข้อ ${c.code}`}
                            className="min-w-0 flex-1 text-xs text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-[#0b1220] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                          />
                        )}
                        <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-[#1e96dc] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0b6cb0]">
                          <Save className="h-3.5 w-3.5" />
                          บันทึกข้อ {c.code}
                        </button>
                      </div>
                    </ResultForm>
                  ) : (
                    e.note && <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{e.note}</p>
                  )}
                </article>
              );
            })}
          </section>
        );
      })}

      {editable && (
        <section className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl bg-[#0b1220] p-4 text-white shadow-xl">
          <p className="flex-1 text-sm">
            {filled < items.length ? `ยังเหลือ ${items.length - filled} ข้อที่ยังไม่ได้กรอก` : "กรอกครบทุกข้อแล้ว — ส่งให้สมาคมฯ ตรวจได้เลย"}
          </p>
          {app.status === "DRAFT" && (
            <ResultForm action={deleteDraft} quiet>
              <input type="hidden" name="id" value={app.id} />
              <ConfirmSubmit message="ลบใบสมัครฉบับร่างนี้และเอกสารที่แนบทั้งหมดใช่ไหม?" className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10">
                ลบฉบับร่าง
              </ConfirmSubmit>
            </ResultForm>
          )}
          <ResultForm action={submitApplication} successText="ส่งใบสมัครแล้ว">
            <input type="hidden" name="id" value={app.id} />
            <ConfirmSubmit message="ส่งใบสมัครให้สมาคมฯ ตรวจใช่ไหม? ระหว่างรอตรวจจะแก้ไขไม่ได้" className="inline-flex items-center gap-2 rounded-xl bg-[#ffd426] px-5 py-2.5 text-sm font-bold text-[#0b1220] hover:bg-[#ffe066]">
              <Send className="h-4 w-4" />
              {app.status === "NEEDS_FIX" ? "ส่งฉบับแก้ไข" : "ส่งใบสมัคร"}
            </ConfirmSubmit>
          </ResultForm>
        </section>
      )}
    </div>
  );
}
