import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MEMBER_STATUS } from "@/lib/academy-portal";
import { thaiDate } from "@/lib/academy";
import { ResultForm } from "@/components/ResultForm";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { ManageShell } from "@/components/academy/ManageShell";
import { AcademyPicker } from "@/components/academy/AcademyPicker";
import { fieldClass } from "@/components/academy/AcademyShell";
import { createAcademyAccount, decideMember, resetAcademyPassword, toggleAcademyAccount } from "../review-actions";
import { Ban, Check, KeyRound, Plus, Search, ShieldCheck, UserPlus, X } from "lucide-react";

export default async function AcademyAccountsPage({ searchParams }: { searchParams: Promise<{ q?: string; academy?: string }> }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) redirect("/academies");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const [members, academies] = await Promise.all([
    prisma.academyMember.findMany({
      include: { user: { select: { email: true, isActive: true, lastLoginAt: true } }, academy: { select: { id: true, nameEn: true, nameTh: true, province: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.academy.findMany({ select: { id: true, nameEn: true, nameTh: true, province: true }, orderBy: { nameEn: "asc" } }),
  ]);
  const pending = members.filter((m) => m.status === "PENDING");
  const others = members.filter(
    (m) => m.status !== "PENDING" && (!q || [m.name, m.user.email, m.academy.nameEn, m.academy.nameTh].some((v) => v?.toLowerCase().includes(q))),
  );
  const initial = academies.find((a) => a.id === Number(sp.academy)) ?? null;

  return (
    <ManageShell active="accounts">
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">บัญชีอคาเดมี</h1>
          <p className="mt-1 text-sm text-slate-500">อคาเดมีใหม่ที่สมัครเองเริ่มใช้งานได้ทันที · การขอสิทธิ์ดูแลอคาเดมีที่มีในทะเบียนแล้วต้องอนุมัติที่นี่ก่อน</p>
        </div>

        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <h2 className="border-b border-slate-100 px-5 py-3.5 font-semibold text-slate-900">คำขอสิทธิ์ดูแลอคาเดมี ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">ไม่มีคำขอที่รออนุมัติ</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pending.map((m) => (
                <li key={m.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      {m.name}
                      {m.position && <span className="font-normal text-slate-500"> · {m.position}</span>}
                    </p>
                    <p className="text-sm text-slate-600">
                      {m.user.email}
                      {m.phone && ` · ${m.phone}`}
                    </p>
                    <p className="mt-1 text-sm">
                      ขอดูแล{" "}
                      <Link href={`/academies/manage/${m.academy.id}`} className="font-semibold text-indigo-700 hover:underline">
                        {m.academy.nameEn}
                      </Link>
                      {m.academy.province && <span className="text-slate-500"> · {m.academy.province}</span>}
                    </p>
                    {m.note && <p className="mt-1.5 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">{m.note}</p>}
                    <p className="mt-1 text-xs text-slate-400">ส่งคำขอ {thaiDate(m.createdAt)}</p>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-72">
                    <ResultForm action={decideMember} quiet>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="decision" value="APPROVE" />
                      <button type="submit" className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                        <Check className="h-4 w-4" />
                        อนุมัติสิทธิ์
                      </button>
                    </ResultForm>
                    <details className="rounded-lg ring-1 ring-slate-200">
                      <summary className="cursor-pointer px-3 py-2 text-center text-sm font-semibold text-red-600">ไม่อนุมัติ</summary>
                      <ResultForm action={decideMember} className="space-y-2 border-t border-slate-100 p-3">
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="decision" value="REJECT" />
                        <textarea name="note" rows={2} required placeholder="เหตุผล (ผู้สมัครจะเห็นข้อความนี้)" className={fieldClass} />
                        <button type="submit" className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">
                          <X className="h-4 w-4" />
                          ยืนยันไม่อนุมัติ
                        </button>
                      </ResultForm>
                    </details>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <details className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200" open={!!initial}>
          <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 text-sm font-semibold text-slate-900">
            <Plus className="h-4 w-4 text-indigo-600" />
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
              <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800">
                <UserPlus className="h-4 w-4" />
                สร้างบัญชี
              </button>
            </div>
          </ResultForm>
        </details>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
            <h2 className="font-semibold text-slate-900">บัญชีทั้งหมด ({others.length})</h2>
            <form action="/academies/manage/accounts" className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input name="q" defaultValue={sp.q ?? ""} placeholder="ค้นหาชื่อ อีเมล หรืออคาเดมี" aria-label="ค้นหาบัญชี" className={`${fieldClass} w-64 py-2 pl-9`} />
            </form>
          </div>
          {others.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-400">ยังไม่มีบัญชี</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {others.map((m) => {
                const status = MEMBER_STATUS[m.status];
                return (
                  <li key={m.id} className={`flex flex-wrap items-center gap-3 px-5 py-3 ${m.user.isActive ? "" : "bg-slate-50"}`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {m.name}
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${status?.tone ?? ""}`}>{status?.label ?? m.status}</span>
                        {!m.user.isActive && <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600">ระงับ</span>}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {m.user.email} ·{" "}
                        <Link href={`/academies/manage/${m.academy.id}`} className="text-indigo-600 hover:underline">
                          {m.academy.nameEn}
                        </Link>
                        {m.user.lastLoginAt && ` · เข้าใช้ล่าสุด ${thaiDate(m.user.lastLoginAt)}`}
                      </p>
                      {m.status === "REJECTED" && m.note && <p className="text-xs text-red-600">เหตุผล: {m.note}</p>}
                    </div>
                    <details className="relative">
                      <summary className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
                        <KeyRound className="h-3.5 w-3.5" />
                        ตั้งรหัสผ่านใหม่
                      </summary>
                      <ResultForm action={resetAcademyPassword} resetOnSuccess successText="ตั้งรหัสผ่านใหม่แล้ว" className="absolute right-0 z-10 mt-1 w-64 space-y-2 rounded-xl bg-white p-3 shadow-lg ring-1 ring-slate-200">
                        <input type="hidden" name="id" value={m.id} />
                        <input name="password" type="text" required minLength={8} autoComplete="off" placeholder="รหัสผ่านใหม่ (8 ตัวขึ้นไป)" aria-label={`รหัสผ่านใหม่ของ ${m.user.email}`} className={`${fieldClass} py-2`} />
                        <button type="submit" className="w-full rounded-lg bg-indigo-700 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-800">
                          บันทึกรหัสผ่าน (ออกจากระบบทุกเครื่อง)
                        </button>
                      </ResultForm>
                    </details>
                    <ResultForm action={toggleAcademyAccount} quiet>
                      <input type="hidden" name="id" value={m.id} />
                      {m.user.isActive ? (
                        <ConfirmSubmit message={`ระงับบัญชี ${m.user.email} ใช่ไหม?`} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50">
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
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </ManageShell>
  );
}
