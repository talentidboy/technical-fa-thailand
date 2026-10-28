import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { changeStaffPassword } from "./actions";
import { KeyRound, Mail, ShieldCheck } from "lucide-react";

export const metadata: Metadata = { title: "ตั้งค่าบัญชี" };

const dt = (d: Date) => d.toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Bangkok" });

// ตั้งค่าบัญชีของผู้ดูแลระบบ / เจ้าหน้าที่ — ดูข้อมูลบัญชี และเปลี่ยนรหัสผ่านด้วยตัวเอง
export default async function StaffSettingsPage() {
  const user = await requireStaff();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ตั้งค่าบัญชี</h1>
        <p className="mt-1 text-sm text-slate-500">ข้อมูลบัญชีที่ใช้เข้าสู่ระบบ และเปลี่ยนรหัสผ่านของคุณ</p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <h2 className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 font-bold text-slate-900">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          บัญชีของฉัน
        </h2>
        <dl className="grid gap-4 p-5 text-sm sm:grid-cols-3">
          <div className="sm:col-span-1">
            <dt className="text-xs text-slate-400">อีเมลสำหรับเข้าสู่ระบบ</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 break-all font-semibold text-slate-800">
              <Mail className="h-4 w-4 flex-none text-slate-400" />
              {user.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">บทบาท</dt>
            <dd className="mt-0.5 font-semibold text-slate-800">{user.role === "ADMIN" ? "ผู้ดูแลระบบ" : "เจ้าหน้าที่"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">เข้าสู่ระบบล่าสุด</dt>
            <dd className="mt-0.5 font-semibold text-slate-800">{user.lastLoginAt ? dt(user.lastLoginAt) : "-"}</dd>
          </div>
        </dl>
      </section>

      <section id="password" className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <KeyRound className="h-5 w-5 text-amber-500" />
            เปลี่ยนรหัสผ่าน
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">ต้องใส่รหัสผ่านปัจจุบันก่อน · เปลี่ยนแล้วอุปกรณ์อื่นที่เคยเข้าสู่ระบบไว้จะออกจากระบบ (เครื่องนี้ใช้ต่อได้)</p>
        </div>
        <div className="p-5">
          <ChangePasswordForm action={changeStaffPassword} />
        </div>
      </section>
    </div>
  );
}
