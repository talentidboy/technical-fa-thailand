import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseId } from "@/lib/route-id";
import { getProvinceOptions } from "@/lib/thai-address";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { LEVEL_META, LICENCE_STATUS, currentLicence, levelRank, licenceState, showPublicly, thaiDate } from "@/lib/academy";
import { APPLICATION_KINDS, APPLICATION_STATUS, MEMBER_STATUS } from "@/lib/academy-portal";
import { LICENCE_LEVELS, POSITIONS, STAFF_ROLES, teamCheck } from "@/lib/academy-checks";
import { loadStaff, loadTeams } from "@/lib/academy-data";
import { ResultForm } from "@/components/ResultForm";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { LevelBadge, LevelMedal, StateChip } from "@/components/academy/AcademyUi";
import { ManageShell } from "@/components/academy/ManageShell";
import { GENDERS } from "@/components/academy/TeamFields";
import { addLicence, deleteAcademy, deleteLicence, toggleAcademyActive, updateAcademy, updateLicence } from "../actions";
import { AcademyFields, LicenceFields } from "../fields";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck2,
  History,
  Pencil,
  Plus,
  Save,
  Shirt,
  Trash2,
  TriangleAlert,
  UserCheck,
  Users,
} from "lucide-react";

export default async function AcademyEditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) redirect("/academies");
  const id = parseId((await params).id);
  if (!id) notFound();
  const [academy, logs, staff, teams] = await Promise.all([
    prisma.academy.findUnique({
      where: { id },
      include: {
        licences: true,
        members: { include: { user: { select: { email: true, isActive: true } } }, orderBy: { id: "asc" } },
        applications: { include: { evidence: { select: { status: true } } }, orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.auditLog.findMany({
      where: { action: { startsWith: "ACADEMY_" }, details: { path: ["academyId"], equals: id } },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    loadStaff(id),
    loadTeams(id),
  ]);
  if (!academy) notFound();

  const now = new Date();
  const current = currentLicence(academy.licences);
  const state = licenceState(current, now);
  const licences = [...academy.licences].sort(
    (a, b) => (b.approvedAt?.getTime() ?? 0) - (a.approvedAt?.getTime() ?? 0) || levelRank(b.level) - levelRank(a.level) || b.id - a.id,
  );
  const provinces = getProvinceOptions().map((p) => p.nameTh);

  return (
    <ManageShell active="registry">
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Link href="/academies/manage" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" />
          กลับทะเบียน
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          <LevelMedal level={current?.level ?? null} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <LevelBadge level={current?.level ?? null} tier={current?.tier} />
              <StateChip state={state} />
              {!academy.active && <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">ปิดการแสดง</span>}
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{academy.nameEn}</h1>
            {academy.nameTh && <p className="text-sm text-slate-500">{academy.nameTh}</p>}
          </div>
          {showPublicly(academy.active, state) ? (
            <Link
              href={`/academies/${academy.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4" />
              ดูหน้าสาธารณะ
            </Link>
          ) : (
            <span className="text-xs text-slate-400">ไม่แสดงบนหน้าสาธารณะ</span>
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <h2 className="border-b border-slate-100 px-6 py-3.5 font-semibold text-slate-900">ข้อมูลอคาเดมี</h2>
            <ResultForm action={updateAcademy} className="p-6">
              <input type="hidden" name="id" value={academy.id} />
              <AcademyFields academy={academy} provinces={provinces} />
              <button type="submit" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
                <Save className="h-4 w-4" />
                บันทึกข้อมูล
              </button>
            </ResultForm>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <h2 className="border-b border-slate-100 px-5 py-3.5 font-semibold text-slate-900">ใบอนุญาต ({licences.length})</h2>
              {licences.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-400">ยังไม่มีใบอนุญาต</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {licences.map((l) => (
                    <li key={l.id} className={l.id === current?.id ? "bg-indigo-50/40" : ""}>
                      <div className="flex items-center gap-3 px-5 py-3">
                        <LevelMedal level={l.level} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <LevelBadge level={l.level} tier={l.tier} />
                            <span className={`text-xs ${l.status === "REVOKED" ? "font-semibold text-red-600" : "text-slate-500"}`}>{LICENCE_STATUS[l.status] ?? l.status}</span>
                            {l.id === current?.id && <span className="text-xs font-semibold text-indigo-600">· ใบปัจจุบัน</span>}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            อนุมัติ {thaiDate(l.approvedAt)} · หมดอายุ {thaiDate(l.expiresAt)}
                            {l.licenceNo && ` · เลขที่ ${l.licenceNo}`}
                          </p>
                          {l.note && <p className="mt-0.5 text-xs text-amber-700">{l.note}</p>}
                        </div>
                        <ResultForm action={deleteLicence} quiet>
                          <input type="hidden" name="id" value={l.id} />
                          <ConfirmSubmit
                            message="ลบใบอนุญาตใบนี้ใช่ไหม? (ถ้าเป็นการระงับ ให้เปลี่ยนสถานะเป็น “ระงับ” แทน)"
                            ariaLabel="ลบใบอนุญาต"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </ConfirmSubmit>
                        </ResultForm>
                      </div>
                      <details className="border-t border-slate-100">
                        <summary className="flex cursor-pointer items-center gap-1.5 px-5 py-2 text-xs font-semibold text-indigo-600 hover:bg-slate-50">
                          <Pencil className="h-3.5 w-3.5" />
                          แก้ไข / เปลี่ยนสถานะ
                        </summary>
                        <ResultForm action={updateLicence} className="border-t border-slate-100 p-5">
                          <input type="hidden" name="id" value={l.id} />
                          <LicenceFields licence={l} withStatus />
                          <button type="submit" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                            <Save className="h-4 w-4" />
                            บันทึกใบอนุญาต
                          </button>
                        </ResultForm>
                      </details>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <h2 className="border-b border-slate-100 px-5 py-3.5 font-semibold text-slate-900">ออกใบอนุญาตใหม่ (ต่ออายุ / เลื่อนระดับ)</h2>
              <ResultForm action={addLicence} resetOnSuccess successText="ออกใบอนุญาตแล้ว" className="p-5">
                <input type="hidden" name="academyId" value={academy.id} />
                <LicenceFields />
                <label className="mt-4 flex items-start gap-2 text-sm text-slate-600">
                  <input type="checkbox" name="supersede" defaultChecked className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                  แทนที่ใบที่มีผลอยู่ (ใบเดิมเปลี่ยนสถานะเป็น “เลื่อนระดับ / ต่ออายุแล้ว”)
                </label>
                <button type="submit" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                  <Plus className="h-4 w-4" />
                  ออกใบอนุญาต
                </button>
              </ResultForm>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="font-semibold text-slate-900">การแสดงผลและการลบ</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <ResultForm action={toggleAcademyActive} quiet>
                  <input type="hidden" name="id" value={academy.id} />
                  <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    {academy.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {academy.active ? "ปิดการแสดงบนหน้าสาธารณะ" : "เปิดการแสดงบนหน้าสาธารณะ"}
                  </button>
                </ResultForm>
                <ResultForm action={deleteAcademy} quiet>
                  <input type="hidden" name="id" value={academy.id} />
                  <ConfirmSubmit
                    message={`ลบ “${academy.nameEn}” และใบอนุญาตทั้งหมดใช่ไหม? (ข้อมูลถูกเก็บสำเนาไว้ในบันทึกการแก้ไข)`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    ลบอคาเดมี
                  </ConfirmSubmit>
                </ResultForm>
              </div>
            </section>

            {logs.length > 0 && (
              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h2 className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <History className="h-4 w-4 text-slate-400" />
                  บันทึกการแก้ไข
                </h2>
                <ul className="mt-3 space-y-2">
                  {logs.map((log) => {
                    const meta = AUDIT_ACTIONS[log.action] ?? { label: log.action, tone: "bg-slate-100 text-slate-600" };
                    return (
                      <li key={log.id} className="text-xs">
                        <span className={`mr-1.5 rounded px-1.5 py-0.5 font-semibold ${meta.tone}`}>{meta.label}</span>
                        <span className="text-slate-600">{log.summary}</span>
                        <p className="mt-0.5 text-slate-400">
                          {log.actorEmail} · {log.createdAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" })}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        </div>

        <h2 className="mt-10 text-sm font-bold uppercase tracking-wider text-indigo-500">ข้อมูลจากพอร์ทัลอคาเดมี</h2>
        <div className="mt-3 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <h3 className="flex items-center gap-1.5 border-b border-slate-100 px-5 py-3.5 font-semibold text-slate-900">
              <UserCheck className="h-4 w-4 text-slate-400" />
              บัญชีผู้ดูแล ({academy.members.length})
            </h3>
            {academy.members.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400">
                ยังไม่มีบัญชี —{" "}
                <Link href={`/academies/manage/accounts?academy=${academy.id}`} className="font-semibold text-indigo-600 hover:underline">
                  สร้างบัญชีให้อคาเดมีนี้
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {academy.members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-slate-900">
                        {m.name}
                        {m.position && <span className="font-normal text-slate-500"> · {m.position}</span>}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {m.user.email}
                        {m.phone && ` · ${m.phone}`}
                      </span>
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${MEMBER_STATUS[m.status]?.tone ?? ""}`}>{MEMBER_STATUS[m.status]?.label ?? m.status}</span>
                    {!m.user.isActive && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600">ระงับ</span>}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/academies/manage/accounts" className="block border-t border-slate-100 px-5 py-2.5 text-xs font-semibold text-indigo-600 hover:bg-slate-50">
              จัดการบัญชี / ตั้งรหัสผ่านใหม่
            </Link>
          </section>

          <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <h3 className="flex items-center gap-1.5 border-b border-slate-100 px-5 py-3.5 font-semibold text-slate-900">
              <FileCheck2 className="h-4 w-4 text-slate-400" />
              ใบสมัคร ({academy.applications.length})
            </h3>
            {academy.applications.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400">ยังไม่มีใบสมัครผ่านระบบ</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {academy.applications.map((a) => {
                  const s = APPLICATION_STATUS[a.status];
                  return (
                    <li key={a.id}>
                      <Link href={`/academies/manage/applications/${a.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-indigo-50/40">
                        <LevelMedal level={a.level} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-slate-900">
                            {LEVEL_META[a.level as keyof typeof LEVEL_META]?.label} · {APPLICATION_KINDS[a.kind]}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {a.submittedAt ? `ส่ง ${thaiDate(a.submittedAt)}` : `เริ่ม ${thaiDate(a.createdAt)}`} · ผ่าน {a.evidence.filter((e) => e.status === "PASS").length}/{a.evidence.length}
                          </span>
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${s.tone}`}>{s.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <h3 className="flex items-center gap-1.5 border-b border-slate-100 px-5 py-3.5 font-semibold text-slate-900">
              <Users className="h-4 w-4 text-slate-400" />
              บุคลากร ({staff.length})
            </h3>
            {staff.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400">อคาเดมียังไม่ได้กรอกรายชื่อบุคลากร</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {staff.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-slate-900">{s.name}</span>
                      <span className="block text-xs text-slate-500">
                        {STAFF_ROLES[s.role] ?? s.role}
                        {s.coach && (
                          <>
                            {" · "}
                            <Link href={`/coaches/${s.coach.id}`} className="text-indigo-600 hover:underline">
                              ประวัติผู้ฝึกสอน
                            </Link>
                          </>
                        )}
                      </span>
                    </span>
                    {s.verifiedLicence ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700" title="ยืนยันจากฐานข้อมูลผู้ฝึกสอน">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        {LICENCE_LEVELS[s.verifiedLicence]}
                      </span>
                    ) : (
                      s.licence && <span className="text-xs text-slate-500">แจ้ง {LICENCE_LEVELS[s.licence] ?? s.licence}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="teams" className="scroll-mt-28 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <h3 className="flex items-center gap-1.5 border-b border-slate-100 px-5 py-3.5 font-semibold text-slate-900">
              <Shirt className="h-4 w-4 text-slate-400" />
              ทีมและนักเตะ ({teams.length} ทีม · {teams.reduce((n, t) => n + t.players.length, 0)} คน)
            </h3>
            {academy.playerConsentAt && (
              <p className="border-b border-slate-100 px-5 py-2 text-xs text-slate-500">
                ยืนยันความยินยอม PDPA โดย {academy.playerConsentBy} · {thaiDate(academy.playerConsentAt)}
              </p>
            )}
            {teams.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400">อคาเดมียังไม่ได้กรอกทีม</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {teams.map((t) => {
                  const r = teamCheck(t);
                  return (
                    <li key={t.id}>
                      <details>
                        <summary className="flex cursor-pointer items-center gap-2 px-5 py-3 text-sm hover:bg-slate-50">
                          {r.ok ? <CheckCircle2 className="h-4 w-4 flex-none text-emerald-500" /> : <TriangleAlert className="h-4 w-4 flex-none text-amber-500" />}
                          <span className="font-medium text-slate-900">{t.name}</span>
                          <span className="text-xs text-slate-500">
                            U{t.ageGroup} · {GENDERS[t.gender] ?? t.gender} · {t.players.length} คน
                          </span>
                        </summary>
                        {t.players.length > 0 && (
                          <div className="overflow-x-auto px-5 pb-3">
                            <table className="w-full text-xs">
                              <thead className="text-left text-slate-400">
                                <tr>
                                  <th className="py-1 pr-2 font-medium">เบอร์</th>
                                  <th className="py-1 pr-2 font-medium">ชื่อ-นามสกุล</th>
                                  <th className="py-1 pr-2 font-medium">ตำแหน่ง</th>
                                  <th className="py-1 font-medium">วันเกิด</th>
                                </tr>
                              </thead>
                              <tbody className="text-slate-700">
                                {t.players.map((p) => (
                                  <tr key={p.id} className="border-t border-slate-100">
                                    <td className="py-1 pr-2 tabular-nums">{p.shirtNo ?? "-"}</td>
                                    <td className="py-1 pr-2">
                                      {p.firstName} {p.lastName}
                                      {p.nickname && <span className="text-slate-400"> ({p.nickname})</span>}
                                    </td>
                                    <td className="py-1 pr-2">{POSITIONS[p.position] ?? p.position}</td>
                                    <td className="py-1">{thaiDate(p.birthDate)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </details>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </ManageShell>
  );
}
