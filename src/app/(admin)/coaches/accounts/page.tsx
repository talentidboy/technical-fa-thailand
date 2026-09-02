import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  createCoachAccount,
  resetCoachPassword,
  toggleCoachAccountActive,
  sendCoachAccountEmail,
  deleteCoachAccount,
} from "./actions";
import { Field, SelectField } from "@/components/FormField";
import { UserPlus, Trash2, KeyRound, ShieldOff, ShieldCheck, Mail, Clock } from "lucide-react";

function formatDateTime(date: Date | null) {
  if (!date) return "ยังไม่เคยเข้าสู่ระบบ";
  return date.toLocaleString("th-TH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const ERROR_MESSAGE: Record<string, string> = {
  invalid_input: "กรุณาเลือกผู้ฝึกสอน กรอกอีเมล และรหัสผ่านอย่างน้อย 8 ตัวอักษร",
  coach_taken: "ผู้ฝึกสอนคนนี้มีบัญชีอยู่แล้ว",
  weak_password: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร",
  coach_not_found: "ไม่พบบัญชีนี้",
  email_not_configured:
    "ยังไม่ได้ตั้งค่าระบบส่งอีเมลของเว็บไซต์นี้ (ต้องเชื่อมต่อผู้ให้บริการอย่าง Resend ก่อน) กรุณาส่งข้อมูลบัญชีให้ผู้ฝึกสอนด้วยตนเองไปก่อน",
  email_send_failed: "ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
};

export default async function CoachAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/coaches");

  const { error, sent } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGE[error] : null;

  const [accounts, coachesWithoutLogin] = await Promise.all([
    prisma.systemUser.findMany({
      where: { role: "COACH" },
      include: { coach: { select: { nameTh: true, surnameTh: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.coach.findMany({
      where: { systemUser: null },
      orderBy: { nameTh: "asc" },
      select: { id: true, nameTh: true, surnameTh: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">บัญชีผู้ฝึกสอน</h1>
        <p className="mt-1 text-sm text-slate-500">
          สร้าง จัดการ และระงับบัญชีล็อกอินของผู้ฝึกสอน — บัญชี Admin/เจ้าหน้าที่จัดการแยกที่{" "}
          <a href="/users" className="font-medium text-indigo-600 hover:text-indigo-700">
            ผู้ใช้งานระบบ
          </a>
        </p>
      </div>

      {sent && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          ส่งอีเมลแจ้งข้อมูลบัญชีแล้ว
        </p>
      )}
      {errorMessage && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <UserPlus className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-slate-900">สร้างบัญชีให้ผู้ฝึกสอน</h2>
        </div>
        <form action={createCoachAccount} className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
          <SelectField
            label="เลือกผู้ฝึกสอน"
            name="coachId"
            required
            options={coachesWithoutLogin.map((c) => ({
              value: String(c.id),
              label: `${c.nameTh} ${c.surnameTh}`,
            }))}
          />
          <Field label="อีเมล" name="email" type="email" required />
          <Field label="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)" name="password" type="password" required />
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
            >
              <UserPlus className="h-4 w-4" />
              สร้างบัญชี
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">บัญชีผู้ฝึกสอนทั้งหมด ({accounts.length})</h2>
        </div>
        {accounts.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-slate-400">ยังไม่มีบัญชีผู้ฝึกสอน</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {accounts.map((account) => (
              <li key={account.id} className="space-y-3 px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {account.coach ? `${account.coach.nameTh} ${account.coach.surnameTh}` : "-"}{" "}
                      <span className="font-normal text-slate-400">· {account.email}</span>
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                          account.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        }`}
                      >
                        {account.isActive ? <ShieldCheck className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
                        {account.isActive ? "ใช้งานได้" : "ถูกระงับ"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(account.lastLoginAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    <form action={toggleCoachAccountActive}>
                      <input type="hidden" name="coachId" value={account.coachId ?? ""} />
                      <button
                        type="submit"
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          account.isActive
                            ? "border-red-200 text-red-600 hover:bg-red-50"
                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {account.isActive ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        {account.isActive ? "ระงับบัญชี" : "เปิดใช้งานอีกครั้ง"}
                      </button>
                    </form>
                    <form action={sendCoachAccountEmail}>
                      <input type="hidden" name="coachId" value={account.coachId ?? ""} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        ส่งอีเมลแจ้งข้อมูลบัญชี
                      </button>
                    </form>
                    <form action={deleteCoachAccount}>
                      <input type="hidden" name="id" value={account.id} />
                      <button
                        type="submit"
                        aria-label="ลบบัญชี"
                        className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>

                <form action={resetCoachPassword} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="coachId" value={account.coachId ?? ""} />
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-500">ตั้งรหัสผ่านใหม่</span>
                    <input
                      name="newPassword"
                      type="text"
                      placeholder="อย่างน้อย 8 ตัวอักษร"
                      className="w-56 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </label>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    รีเซ็ตรหัสผ่าน
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
