import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MEMBER_STATUS } from "@/lib/academy-portal";
import { thaiDate } from "@/lib/academy";
import { ResultForm } from "@/components/ResultForm";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { Card, PageBody, PageHeader, TabLinks, btn } from "@/components/academy/ManageUi";
import { AcademyPicker } from "@/components/academy/AcademyPicker";
import { fieldClass } from "@/components/academy/AcademyShell";
import { createAcademyAccount, decideMember, deleteAcademyAccount, resetAcademyPassword, toggleAcademyAccount } from "../review-actions";
import { Ban, Check, Inbox, KeyRound, Phone, Plus, Search, ShieldCheck, Trash2, UserCheck, UserPlus, Users, X } from "lucide-react";

// ตัวกรองบัญชี
const FILTERS = {
  all: "ทั้งหมด",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ไม่อนุมัติ",
  suspended: "ระงับ",
} as const;
type Filter = keyof typeof FILTERS;

const REJECT_REASONS = ["ไม่ใช่ผู้ดูแลของอคาเดมีนี้", "ติดต่อยืนยันตัวตนไม่ได้", "อคาเดมีมีผู้ดูแลอยู่แล้ว", "ข้อมูลไม่ครบ กรุณาสมัครใหม่"];

export default async function AcademyAccountsPage({ searchParams }: { searchParams: Promise<{ q?: string; academy?: string; status?: string }> }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) redirect("/academies");
  const isAdmin = user.role === "ADMIN";
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const filter: Filter = sp.status && sp.status in FILTERS ? (sp.status as Filter) : "all";
  const [members, academies] = await Promise.all([
    prisma.academyMember.findMany({
      include: {
        user: { select: { email: true, isActive: true, lastLoginAt: true } },
        academy: { select: { id: true, nameEn: true, nameTh: true, province: true, contactName: true, phone: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.academy.findMany({ select: { id: true, nameEn: true, nameTh: true, province: true }, orderBy: { nameEn: "asc" } }),
  ]);
  const pending = members.filter((m) => m.status === "PENDING");
  const decided = members.filter((m) => m.status !== "PENDING");
  const matchFilter = (m: (typeof members)[number], f: Filter) =>
    f === "all" ? true : f === "suspended" ? !m.user.isActive : m.status === f && m.user.isActive;
  const others = decided.filter((m) => matchFilter(m, filter) && (!q || [m.name, m.user.email, m.academy.nameEn, m.academy.nameTh].some((v) => v?.toLowerCase().includes(q))));
  const managersOf = (academyId: number, except: number) => members.filter((m) => m.academyId === academyId && m.status === "APPROVED" && m.id !== except);
  const initial = academies.find((a) => a.id === Number(sp.academy)) ?? null;
  const href = (f: Filter) => {
    const p = new URLSearchParams();
    if (f !== "all") p.set("status", f);
    if (sp.q) p.set("q", sp.q);
    return `/academies/manage/accounts${p.size ? `?${p}` : ""}#list`;
  };

  return (
    <>
      <PageHeader title="บัญชีอคาเดมี" description="อคาเดมีใหม่ที่สมัครเองเริ่มใช้งานได้ทันที · การขอสิทธิ์ดูแลอคาเดมีที่มีในทะเบียนแล้วต้องตรวจสอบและอนุมัติที่นี่ก่อน" />
      <PageBody>
        <Card title={`คำขอสิทธิ์ดูแลอคาเดมี — รอตรวจสอบ (${pending.length})`} icon={Inbox} tone={pending.length ? "amber" : "sky"} flush>
          {pending.length === 0 ? (
            <p className="flex items-center justify-center gap-2 px-5 py-8 text-sm font-semibold text-emerald-700">
              <Check className="h-4 w-4" />
              ไม่มีคำขอที่รออนุมัติ
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pending.map((m) => {
                const managers = managersOf(m.academyId, m.id);
                return (
                  <li key={m.id} className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_17rem]">
                    {/* ผู้ขอ */}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-500">ผู้ขอสิทธิ์</p>
                      <p className="mt-0.5 font-bold text-[#0b1220]">
                        {m.name}
                        {m.position && <span className="font-normal text-slate-500"> · {m.position}</span>}
                      </p>
                      <p className="text-sm text-slate-600">
                        {m.user.email}
                        {m.phone && ` · ${m.phone}`}
                      </p>
                      {m.note && <p className="mt-2 whitespace-pre-line rounded-xl bg-[#f4f8fc] px-3 py-2 text-sm text-slate-700">“{m.note}”</p>}
                      <p className="mt-1.5 text-xs text-slate-400">ส่งคำขอ {thaiDate(m.createdAt)}</p>
                    </div>

                    {/* ข้อมูลสำหรับตรวจสอบ */}
                    <div className="min-w-0 rounded-xl bg-amber-50/60 p-3 ring-1 ring-amber-200">
                      <p className="text-xs font-bold text-amber-800">ตรวจสอบก่อนอนุมัติ</p>
                      <p className="mt-1 text-sm">
                        ขอดูแล{" "}
                        <Link href={`/academies/manage/${m.academy.id}`} className={btn.link}>
                          {m.academy.nameEn}
                        </Link>
                        {m.academy.province && <span className="text-slate-500"> · {m.academy.province}</span>}
                      </p>
                      {(m.academy.contactName || m.academy.phone || m.academy.email) ? (
                        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-700">
                          <Phone className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-600" />
                          <span>
                            ติดต่อในทะเบียน: {[m.academy.contactName, m.academy.phone, m.academy.email].filter(Boolean).join(" · ")}
                            <span className="block text-slate-500">โทรยืนยันกับผู้ติดต่อนี้ได้ว่าผู้ขอเป็นผู้ดูแลจริง</span>
                          </span>
                        </p>
                      ) : (
                        <p className="mt-1.5 text-xs text-slate-500">ไม่มีข้อมูลติดต่อในทะเบียน</p>
                      )}
                      <p className={`mt-1.5 text-xs ${managers.length ? "font-semibold text-amber-800" : "text-slate-500"}`}>
                        {managers.length ? `อคาเดมีนี้มีผู้ดูแลแล้ว ${managers.length} คน: ${managers.map((x) => x.user.email).join(", ")}` : "อคาเดมีนี้ยังไม่มีผู้ดูแลในระบบ"}
                      </p>
                    </div>

                    {/* ตัดสิน */}
                    <div className="flex flex-col gap-2">
                      <ResultForm action={decideMember} quiet>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="decision" value="APPROVE" />
                        <button type="submit" className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
                          <Check className="h-4 w-4" />
                          อนุมัติสิทธิ์
                        </button>
                      </ResultForm>
                      <details className="rounded-xl bg-white ring-1 ring-red-200 open:bg-red-50">
                        <summary className="cursor-pointer px-3 py-2 text-center text-sm font-bold text-red-600">ไม่อนุมัติ</summary>
                        <ResultForm action={decideMember} className="space-y-2 px-3 pb-3">
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="decision" value="REJECT" />
                          <select name="note" defaultValue="" className={`${fieldClass} py-2`} aria-label="เหตุผลสำเร็จรูป" required>
                            <option value="" disabled>
                              เลือกเหตุผล
                            </option>
                            {REJECT_REASONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          <button type="submit" className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700">
                            <X className="h-4 w-4" />
                            ยืนยันไม่อนุมัติ
                          </button>
                        </ResultForm>
                        <ResultForm action={decideMember} className="space-y-2 border-t border-red-100 px-3 py-3">
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="decision" value="REJECT" />
                          <textarea name="note" rows={2} required placeholder="หรือเขียนเหตุผลเอง (ผู้สมัครจะเห็นข้อความนี้)" className={`${fieldClass} py-2`} />
                          <button type="submit" className={`${btn.danger} w-full py-2`}>
                            ไม่อนุมัติพร้อมเหตุผลนี้
                          </button>
                        </ResultForm>
                      </details>
                      {isAdmin && <DeleteAccount id={m.id} email={m.user.email} label="ลบคำขอและบัญชีนี้" />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <details className="overflow-hidden rounded-2xl border border-t-4 border-slate-200 border-t-emerald-500 bg-white" open={!!initial}>
          <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 text-[15px] font-bold text-[#0b1220]">
            <Plus className="h-4.5 w-4.5 text-emerald-600" />
            สร้างบัญชีให้อคาเดมีในทะเบียน
          </summary>
          <ResultForm action={createAcademyAccount} resetOnSuccess successText="สร้างบัญชีแล้ว — แจ้งอีเมลและรหัสผ่านให้อคาเดมี" className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-sm font-medium text-slate-700">
                อคาเดมี<span className="text-red-500"> *</span>
              </p>
              <AcademyPicker name="academyId" academies={academies} initial={initial} />
            </div>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              ชื่อผู้ดูแล *
              <input name="name" required className={fieldClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              เบอร์โทรศัพท์
              <input name="phone" type="tel" className={fieldClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              อีเมล (ใช้เข้าสู่ระบบ) *
              <input name="email" type="email" required autoComplete="off" className={fieldClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              รหัสผ่านเริ่มต้น (อย่างน้อย 8 ตัวอักษร) *
              <input name="password" type="text" required minLength={8} autoComplete="off" className={fieldClass} />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className={btn.primary}>
                <UserPlus className="h-4 w-4" />
                สร้างบัญชี
              </button>
            </div>
          </ResultForm>
        </details>

        <div id="list" className="scroll-mt-6">
          <Card
            title={`บัญชีทั้งหมด (${others.length})`}
            icon={Users}
            tone="violet"
            flush
            actions={
              <form action="/academies/manage/accounts" className="relative">
                {filter !== "all" && <input type="hidden" name="status" value={filter} />}
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input name="q" defaultValue={sp.q ?? ""} placeholder="ค้นหาชื่อ อีเมล หรืออคาเดมี" aria-label="ค้นหาบัญชี" className={`${fieldClass} w-64 py-2 pl-9`} />
              </form>
            }
          >
            <div className="border-b border-slate-100 px-4 pt-3">
              <TabLinks
                active={filter}
                tabs={(Object.keys(FILTERS) as Filter[]).map((f) => ({ key: f, href: href(f), label: FILTERS[f], count: decided.filter((m) => matchFilter(m, f)).length }))}
              />
            </div>
            {others.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-400">ไม่มีบัญชีในกลุ่มนี้</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {others.map((m) => {
                  const status = MEMBER_STATUS[m.status];
                  return (
                    <li key={m.id} className={`flex flex-wrap items-center gap-3 px-5 py-3.5 ${m.user.isActive ? "" : "bg-slate-50"}`}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#0b1220]">
                          {m.name}
                          <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${status?.tone ?? ""}`}>{status?.label ?? m.status}</span>
                          {!m.user.isActive && <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600">ระงับ</span>}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {m.user.email} ·{" "}
                          <Link href={`/academies/manage/${m.academy.id}`} className="font-semibold text-[#0b6cb0] hover:underline">
                            {m.academy.nameEn}
                          </Link>
                          {m.user.lastLoginAt ? ` · เข้าใช้ล่าสุด ${thaiDate(m.user.lastLoginAt)}` : " · ยังไม่เคยเข้าใช้"}
                        </p>
                        {m.status === "REJECTED" && m.note && <p className="text-xs text-red-600">เหตุผล: {m.note}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {m.status === "REJECTED" && (
                          <ResultForm action={decideMember} quiet>
                            <input type="hidden" name="id" value={m.id} />
                            <input type="hidden" name="decision" value="APPROVE" />
                            <ConfirmSubmit
                              message={`เปลี่ยนเป็นอนุมัติสิทธิ์ดูแล ${m.academy.nameEn} ให้ ${m.user.email} ใช่ไหม?`}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              เปลี่ยนเป็นอนุมัติ
                            </ConfirmSubmit>
                          </ResultForm>
                        )}
                        <details className="relative">
                          <summary className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
                            <KeyRound className="h-3.5 w-3.5" />
                            ตั้งรหัสผ่านใหม่
                          </summary>
                          <ResultForm action={resetAcademyPassword} resetOnSuccess successText="ตั้งรหัสผ่านใหม่แล้ว" className="absolute right-0 z-10 mt-1 w-64 space-y-2 rounded-xl bg-white p-3 shadow-lg ring-1 ring-slate-200">
                            <input type="hidden" name="id" value={m.id} />
                            <input name="password" type="text" required minLength={8} autoComplete="off" placeholder="รหัสผ่านใหม่ (8 ตัวขึ้นไป)" aria-label={`รหัสผ่านใหม่ของ ${m.user.email}`} className={`${fieldClass} py-2`} />
                            <button type="submit" className={`${btn.primary} w-full px-3 py-2 text-xs`}>
                              บันทึกรหัสผ่าน (ออกจากระบบทุกเครื่อง)
                            </button>
                          </ResultForm>
                        </details>
                        <ResultForm action={toggleAcademyAccount} quiet>
                          <input type="hidden" name="id" value={m.id} />
                          {m.user.isActive ? (
                            <ConfirmSubmit message={`ระงับบัญชี ${m.user.email} ใช่ไหม? (เข้าสู่ระบบไม่ได้จนกว่าจะเปิดใช้)`} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 hover:bg-amber-50">
                              <Ban className="h-3.5 w-3.5" />
                              ระงับ
                            </ConfirmSubmit>
                          ) : (
                            <button type="submit" className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              เปิดใช้
                            </button>
                          )}
                        </ResultForm>
                        {isAdmin && <DeleteAccount id={m.id} email={m.user.email} label="ลบบัญชี" />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          {!isAdmin && <p className="mt-2 text-xs text-slate-400">การลบบัญชีทำได้เฉพาะผู้ดูแลระบบ — เจ้าหน้าที่ใช้ “ระงับ” แทนได้</p>}
        </div>
      </PageBody>
    </>
  );
}

// ลบบัญชีถาวร (ผู้ดูแลระบบเท่านั้น) — ข้อมูลอคาเดมีไม่หาย
function DeleteAccount({ id, email, label }: { id: number; email: string; label: string }) {
  return (
    <ResultForm action={deleteAcademyAccount} quiet>
      <input type="hidden" name="id" value={id} />
      <ConfirmSubmit
        message={`ลบบัญชี ${email} ถาวรใช่ไหม? เจ้าของบัญชีจะเข้าสู่ระบบไม่ได้อีก (ข้อมูลอคาเดมี ทีม และใบสมัครยังอยู่ครบ)`}
        ariaLabel={`ลบบัญชี ${email}`}
        className="inline-flex w-full items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {label}
      </ConfirmSubmit>
    </ResultForm>
  );
}
