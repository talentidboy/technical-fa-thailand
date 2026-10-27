import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseId } from "@/lib/route-id";
import { getProvinceOptions } from "@/lib/thai-address";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { LEVEL_META, LICENCE_STATUS, currentLicence, daysUntil, isLevel, levelRank, licenceState, showPublicly, thaiDate } from "@/lib/academy";
import { APPLICATION_KINDS, APPLICATION_STATUS, MEMBER_STATUS } from "@/lib/academy-portal";
import { LICENCE_LEVELS, POSITIONS, STAFF_ROLES, teamCheck } from "@/lib/academy-checks";
import { loadStaff, loadTeams } from "@/lib/academy-data";
import { ResultForm } from "@/components/ResultForm";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { LevelBadge, StateChip } from "@/components/academy/AcademyUi";
import { GENDERS } from "@/components/academy/TeamFields";
import { ActionSwitch } from "@/components/academy/ActionSwitch";
import { IssueLicenceForm, RevokeLicenceForm } from "@/components/academy/LicenceForms";
import { Card, Empty, PageBody, PageHeader, TabLinks, btn } from "@/components/academy/ManageUi";
import { deleteAcademy, deleteLicence, reactivateLicence, toggleAcademyActive, updateAcademy, updateLicence } from "../actions";
import { AcademyFields, LicenceFields } from "../fields";
import { BadgeCheck, Building2, CheckCircle2, ExternalLink, Eye, EyeOff, FileCheck2, Gavel, Globe, History, LayoutGrid, Phone, RotateCcw, Save, Shirt, Trash2, TriangleAlert, UserCheck, Users } from "lucide-react";

const TABS = ["overview", "info", "licences", "people", "applications", "accounts", "history"] as const;
type Tab = (typeof TABS)[number];

// หน้ารายละเอียดอคาเดมี (หลังบ้าน) — แยกเป็นแท็บ: ภาพรวม / ข้อมูล / ใบอนุญาต / บุคลากรและทีม / ใบสมัคร / บัญชีผู้ดูแล / ประวัติ
export default async function AcademyManagePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const id = parseId((await params).id);
  if (!id) notFound();
  const sp = await searchParams;
  const tab: Tab = TABS.includes(sp.tab as Tab) ? (sp.tab as Tab) : "overview";
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
      take: tab === "history" ? 100 : 5,
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
  const active = current?.status === "ACTIVE" ? current : null;
  // มีใบอนุญาตแต่ไม่มีใบที่มีผลเลย (ทุกใบถูกแทนที่) → อคาเดมีหลุดจากทะเบียนสาธารณะ ต้องให้แอดมินเห็นและแก้ได้ทันที
  const orphaned = !current && licences.find((l) => l.status === "SUPERSEDED");
  const players = teams.reduce((n, t) => n + t.players.length, 0);
  const pendingMembers = academy.members.filter((m) => m.status === "PENDING").length;
  const submittedApps = academy.applications.filter((a) => a.status === "SUBMITTED").length;
  const base = `/academies/manage/${academy.id}`;
  const tabHref = (t: Tab) => (t === "overview" ? base : `${base}?tab=${t}`);
  const days = active?.expiresAt ? daysUntil(active.expiresAt, now) : null;

  const orphanBanner = orphaned && (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <TriangleAlert className="h-5 w-5 flex-none text-amber-600" />
      <p className="min-w-0 flex-1 text-sm text-amber-900">
        อคาเดมีนี้ไม่มีใบอนุญาตที่มีผล — ใบ {isLevel(orphaned.level) ? LEVEL_META[orphaned.level].label : "ยังไม่ระบุระดับ"} (อนุมัติ {thaiDate(orphaned.approvedAt)}) ถูกตั้งเป็น “เลื่อนระดับ / ต่ออายุแล้ว”
        แต่ไม่มีใบใหม่มาแทน จึงไม่แสดงบนหน้าสาธารณะ
      </p>
      <ResultForm action={reactivateLicence} quiet>
        <input type="hidden" name="id" value={orphaned.id} />
        <button type="submit" className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
          <RotateCcw className="h-4 w-4" />
          คืนสถานะใบนี้เป็นมีผล
        </button>
      </ResultForm>
    </div>
  );

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/academies/manage/academies", label: "อคาเดมี" }]}
        title={academy.nameEn}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {academy.nameTh && <span>{academy.nameTh}</span>}
            {academy.province && <span>· {academy.province}</span>}
            <LevelBadge level={current?.level ?? null} tier={current?.tier} />
            <StateChip state={state} />
            {!academy.active && <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">ปิดการแสดง</span>}
          </span>
        }
        actions={
          showPublicly(academy.active, state) ? (
            <Link href={`/academies/${academy.id}`} className={btn.secondary}>
              <ExternalLink className="h-4 w-4" />
              หน้าสาธารณะ
            </Link>
          ) : (
            <span className="text-xs text-slate-400">ไม่แสดงบนหน้าสาธารณะ</span>
          )
        }
      >
        <TabLinks
          active={tab}
          tabs={[
            { key: "overview", href: tabHref("overview"), label: "ภาพรวม" },
            { key: "info", href: tabHref("info"), label: "ข้อมูลอคาเดมี" },
            { key: "licences", href: tabHref("licences"), label: "ใบอนุญาต", count: licences.length, alert: !!orphaned },
            { key: "people", href: tabHref("people"), label: "บุคลากรและทีม", count: staff.length + teams.length },
            { key: "applications", href: tabHref("applications"), label: "ใบสมัคร", count: academy.applications.length, alert: submittedApps > 0 },
            { key: "accounts", href: tabHref("accounts"), label: "บัญชีผู้ดูแล", count: academy.members.length, alert: pendingMembers > 0 },
            { key: "history", href: tabHref("history"), label: "ประวัติการแก้ไข" },
          ]}
        />
      </PageHeader>

      <PageBody>
        {(tab === "overview" || tab === "licences") && orphanBanner}

        {tab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="ใบอนุญาตปัจจุบัน" icon={BadgeCheck} tone="amber" className="lg:col-span-2" actions={<Link href={tabHref("licences")} className={`${btn.link} text-xs`}>จัดการใบอนุญาต</Link>}>
              {current ? (
                <dl className="grid gap-4 sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-slate-500">ระดับ</dt>
                    <dd className="mt-1">
                      <LevelBadge level={current.level} tier={current.tier} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">เลขที่</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">{current.licenceNo ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">อนุมัติ</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">{thaiDate(current.approvedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">หมดอายุ</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">
                      {current.expiresAt ? thaiDate(current.expiresAt) : "ไม่ระบุ"}
                      {days !== null && <span className={`block text-xs font-normal ${days < 0 ? "text-red-600" : days <= 60 ? "text-amber-700" : "text-slate-500"}`}>{days < 0 ? `หมดอายุแล้ว ${-days} วัน` : `อีก ${days} วัน`}</span>}
                    </dd>
                  </div>
                </dl>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">ยังไม่มีใบอนุญาตที่มีผล</p>
                  <Link href={tabHref("licences")} className={btn.primary}>
                    ออกใบอนุญาต
                  </Link>
                </div>
              )}
            </Card>
            <Card title="การแสดงผลบนหน้าสาธารณะ" icon={Globe} tone="emerald">
              <p className="text-sm text-slate-600">{showPublicly(academy.active, state) ? "แสดงอยู่บนแผนที่และทำเนียบ" : academy.active ? "ไม่แสดง (ไม่มีใบอนุญาตที่มีผล)" : "ปิดการแสดงไว้"}</p>
              <ResultForm action={toggleAcademyActive} quiet className="mt-3">
                <input type="hidden" name="id" value={academy.id} />
                <button type="submit" className={btn.secondary}>
                  {academy.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {academy.active ? "ปิดการแสดงบนหน้าสาธารณะ" : "เปิดการแสดงบนหน้าสาธารณะ"}
                </button>
              </ResultForm>
            </Card>
            <Card title="ติดต่อ (ใช้ภายใน)" icon={Phone} tone="violet" actions={<Link href={tabHref("info")} className={`${btn.link} text-xs`}>แก้ไข</Link>}>
              <dl className="space-y-2 text-sm">
                {[
                  ["ผู้ประสานงาน", academy.contactName],
                  ["เบอร์โทร", academy.phone],
                  ["อีเมล", academy.email],
                  ["สโมสรต้นสังกัด", academy.parentClub],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="truncate text-right font-medium text-slate-900">{v || "-"}</dd>
                  </div>
                ))}
              </dl>
            </Card>
            <Card title="พอร์ทัลอคาเดมี" icon={LayoutGrid} className="lg:col-span-2">
              <dl className="grid gap-3 sm:grid-cols-4">
                {[
                  { k: "บัญชีผู้ดูแล", v: academy.members.length, sub: pendingMembers ? `รออนุมัติ ${pendingMembers}` : null, t: "accounts" as const },
                  { k: "บุคลากร", v: staff.length, sub: null, t: "people" as const },
                  { k: "ทีม / นักเตะ", v: `${teams.length} / ${players}`, sub: null, t: "people" as const },
                  { k: "ใบสมัคร", v: academy.applications.length, sub: academy.applications[0] ? APPLICATION_STATUS[academy.applications[0].status]?.label : null, t: "applications" as const },
                ].map((d) => (
                  <Link key={d.k} href={tabHref(d.t)} className="rounded-md border border-slate-200 p-3 hover:border-slate-400">
                    <dt className="text-xs text-slate-500">{d.k}</dt>
                    <dd className="mt-1 text-lg font-semibold text-slate-900">{d.v}</dd>
                    {d.sub && <dd className="text-xs text-amber-700">{d.sub}</dd>}
                  </Link>
                ))}
              </dl>
            </Card>
            <Card title="แก้ไขล่าสุด" icon={History} tone="ink" flush className="lg:col-span-3" actions={<Link href={tabHref("history")} className={`${btn.link} text-xs`}>ทั้งหมด</Link>}>
              {logs.length === 0 ? <Empty>ยังไม่มีการแก้ไข</Empty> : <LogList logs={logs} />}
            </Card>
          </div>
        )}

        {tab === "info" && (
          <>
            <Card title="ข้อมูลอคาเดมี" icon={Building2}>
              <ResultForm action={updateAcademy}>
                <input type="hidden" name="id" value={academy.id} />
                <AcademyFields academy={academy} provinces={getProvinceOptions().map((p) => p.nameTh)} />
                <button type="submit" className={`${btn.primary} mt-5`}>
                  <Save className="h-4 w-4" />
                  บันทึกข้อมูล
                </button>
              </ResultForm>
            </Card>
            <Card title="ลบอคาเดมี" icon={Trash2} tone="red" className="border-red-200">
              <p className="text-sm text-slate-600">ลบออกจากทะเบียนพร้อมใบอนุญาตทั้งหมด (เก็บสำเนาไว้ในบันทึกการแก้ไข) — อคาเดมีที่มีบัญชีหรือใบสมัครในพอร์ทัลแล้วลบไม่ได้ ให้ปิดการแสดงแทน</p>
              <ResultForm action={deleteAcademy} quiet className="mt-3">
                <input type="hidden" name="id" value={academy.id} />
                <ConfirmSubmit message={`ลบ “${academy.nameEn}” และใบอนุญาตทั้งหมดใช่ไหม?`} className={btn.danger}>
                  <Trash2 className="h-4 w-4" />
                  ลบอคาเดมี
                </ConfirmSubmit>
              </ResultForm>
            </Card>
          </>
        )}

        {tab === "licences" && (
          <>
            <Card title="คำสั่งใบอนุญาต" icon={Gavel} tone="amber">
              {active ? (
                <>
                  <p className="mb-4 text-sm text-slate-600">
                    ใบที่มีผล: <LevelBadge level={active.level} tier={active.tier} /> {active.licenceNo && <span className="font-semibold">· {active.licenceNo}</span>} · หมดอายุ {active.expiresAt ? thaiDate(active.expiresAt) : "ไม่ระบุ"}
                  </p>
                  <ActionSwitch
                    items={[
                      { key: "renew", label: "ต่ออายุ", content: <IssueLicenceForm academyId={academy.id} kind="RENEW" current={active} /> },
                      { key: "change", label: "เปลี่ยนระดับ", content: <IssueLicenceForm academyId={academy.id} kind="CHANGE" current={active} /> },
                      { key: "revoke", label: "พักใช้ / เพิกถอน", danger: true, content: <RevokeLicenceForm licenceId={active.id} /> },
                    ]}
                  />
                </>
              ) : (
                <>
                  <p className="mb-4 text-sm text-slate-600">
                    {current?.status === "REVOKED" ? "ใบอนุญาตล่าสุดถูกพักใช้ — คืนสถานะใบเดิม หรือออกใบอนุญาตใหม่" : "ยังไม่มีใบอนุญาตที่มีผล"}
                  </p>
                  {current?.status === "REVOKED" && (
                    <ResultForm action={reactivateLicence} quiet className="mb-4">
                      <input type="hidden" name="id" value={current.id} />
                      <button type="submit" className={btn.secondary}>
                        <RotateCcw className="h-4 w-4" />
                        คืนสถานะใบที่ถูกพักใช้
                      </button>
                    </ResultForm>
                  )}
                  <ActionSwitch items={[{ key: "new", label: "ออกใบอนุญาตใหม่", content: <IssueLicenceForm academyId={academy.id} kind="NEW" /> }]} />
                </>
              )}
            </Card>
            <Card title={`ประวัติใบอนุญาต (${licences.length})`} icon={History} tone="amber" flush>
              {licences.length === 0 ? (
                <Empty>ยังไม่มีใบอนุญาต</Empty>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {licences.map((l) => (
                    <li key={l.id} className={l.id === current?.id ? "bg-slate-50" : ""}>
                      <div className="flex flex-wrap items-center gap-3 px-5 py-3">
                        <LevelBadge level={l.level} tier={l.tier} />
                        <span className={`text-xs font-semibold ${l.status === "ACTIVE" ? "text-emerald-700" : l.status === "REVOKED" ? "text-red-600" : "text-slate-500"}`}>
                          {LICENCE_STATUS[l.status] ?? l.status}
                        </span>
                        <span className="min-w-0 flex-1 text-xs text-slate-500">
                          {l.licenceNo && <span className="font-semibold text-slate-700">{l.licenceNo} · </span>}
                          อนุมัติ {thaiDate(l.approvedAt)} · หมดอายุ {thaiDate(l.expiresAt)}
                          {l.note && <span className="block text-amber-700">{l.note}</span>}
                        </span>
                        <ResultForm action={deleteLicence} quiet>
                          <input type="hidden" name="id" value={l.id} />
                          <ConfirmSubmit
                            message="ลบใบอนุญาตนี้ใช่ไหม? (ใช้กับใบที่บันทึกผิดเท่านั้น — ถ้าต้องการหยุดใบอนุญาต ให้ใช้ “พักใช้”)"
                            ariaLabel="ลบใบอนุญาต"
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            ลบ
                          </ConfirmSubmit>
                        </ResultForm>
                      </div>
                      <details className="border-t border-slate-100">
                        <summary className="cursor-pointer px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">แก้ไขรายละเอียด (กรณีบันทึกผิด)</summary>
                        <ResultForm action={updateLicence} className="border-t border-slate-100 p-5">
                          <input type="hidden" name="id" value={l.id} />
                          <LicenceFields licence={l} />
                          <button type="submit" className={`${btn.primary} mt-4`}>
                            <Save className="h-4 w-4" />
                            บันทึกใบอนุญาต
                          </button>
                        </ResultForm>
                      </details>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}

        {tab === "people" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title={`บุคลากร (${staff.length})`} icon={Users} tone="violet" flush>
              {staff.length === 0 ? (
                <Empty>อคาเดมียังไม่ได้กรอกรายชื่อบุคลากร</Empty>
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
                              <Link href={`/coaches/${s.coach.id}`} className="hover:underline">
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
            </Card>
            <Card title={`ทีมและนักเตะ (${teams.length} ทีม · ${players} คน)`} icon={Shirt} tone="emerald" flush>
              {academy.playerConsentAt && (
                <p className="border-b border-slate-100 px-5 py-2 text-xs text-slate-500">
                  ยืนยันความยินยอม PDPA โดย {academy.playerConsentBy} · {thaiDate(academy.playerConsentAt)}
                </p>
              )}
              {teams.length === 0 ? (
                <Empty>อคาเดมียังไม่ได้กรอกทีม</Empty>
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
            </Card>
          </div>
        )}

        {tab === "applications" && (
          <Card title={`ใบสมัคร (${academy.applications.length})`} icon={FileCheck2} flush>
            {academy.applications.length === 0 ? (
              <Empty>ยังไม่มีใบสมัครผ่านระบบ</Empty>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {academy.applications.map((a) => {
                  const s = APPLICATION_STATUS[a.status];
                  return (
                    <li key={a.id}>
                      <Link href={`/academies/manage/applications/${a.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-slate-900">
                            FAT {isLevel(a.level) ? LEVEL_META[a.level].label : a.level} · {APPLICATION_KINDS[a.kind]}
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
          </Card>
        )}

        {tab === "accounts" && (
          <Card
            title={`บัญชีผู้ดูแล (${academy.members.length})`}
            icon={UserCheck}
            tone="violet"
            flush
            actions={
              <Link href={`/academies/manage/accounts?academy=${academy.id}`} className={`${btn.link} text-xs`}>
                {academy.members.length ? "จัดการบัญชี / ตั้งรหัสผ่านใหม่" : "สร้างบัญชีให้อคาเดมีนี้"}
              </Link>
            }
          >
            {academy.members.length === 0 ? (
              <Empty>ยังไม่มีบัญชีผู้ดูแล</Empty>
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
          </Card>
        )}

        {tab === "history" && (
          <Card title="ประวัติการแก้ไข" icon={History} tone="ink" flush>
            {logs.length === 0 ? <Empty>ยังไม่มีการแก้ไข</Empty> : <LogList logs={logs} />}
          </Card>
        )}
      </PageBody>
    </>
  );
}

function LogList({ logs }: { logs: { id: number; action: string; summary: string; actorEmail: string; createdAt: Date }[] }) {
  return (
    <ul className="divide-y divide-slate-100">
      {logs.map((log) => {
        const meta = AUDIT_ACTIONS[log.action] ?? { label: log.action, tone: "bg-slate-100 text-slate-600" };
        return (
          <li key={log.id} className="px-5 py-2.5 text-xs">
            <span className={`mr-1.5 rounded px-1.5 py-0.5 font-semibold ${meta.tone}`}>{meta.label}</span>
            <span className="text-slate-700">{log.summary}</span>
            <p className="mt-0.5 text-slate-400">
              {log.actorEmail} · {log.createdAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" })}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
