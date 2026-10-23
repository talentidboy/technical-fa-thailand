import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAcademyUser, getCurrentUser } from "@/lib/auth";
import { authInputClass } from "@/components/academy/AcademyShell";
import { AuthShell } from "@/components/academy/AuthShell";
import { LoginSubmit, PasswordInput } from "@/components/academy/AuthFields";
import { academyLogin } from "../account-actions";
import { AlertCircle, ArrowLeft, Bell, ClipboardCheck, Mail, UserPlus, Users } from "lucide-react";

export const metadata: Metadata = { title: "เข้าสู่ระบบอคาเดมี | Academy Licensing" };

const ERRORS: Record<string, string> = {
  "1": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  disabled: "บัญชีนี้ถูกระงับการใช้งาน — โปรดติดต่อสมาคมฯ",
  coach: "บัญชีผู้ฝึกสอนเข้าสู่ระบบที่ศูนย์อบรมผู้ฝึกสอน",
};

const POINTS = [
  { icon: Users, title: "ข้อมูลอคาเดมี บุคลากร ทีมและนักเตะ", desc: "อัปเดตเองได้ตลอด ระบบตรวจเกณฑ์ที่นับได้ให้อัตโนมัติ" },
  { icon: ClipboardCheck, title: "ยื่นขอ ต่ออายุ หรือเลื่อนระดับ", desc: "แนบหลักฐานทีละข้อตามเกณฑ์ของระดับที่ขอ" },
  { icon: Bell, title: "ติดตามผลการตรวจ", desc: "เห็นความเห็นจากสมาคมฯ รายข้อ พร้อมแจ้งเตือน" },
];

export default async function AcademyLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAcademyUser()) redirect("/academies/portal");
  const staff = await getCurrentUser();
  if (staff && (staff.role === "ADMIN" || staff.role === "STAFF")) redirect("/academies/manage");
  const { error } = await searchParams;

  return (
    <AuthShell eyebrow="Academy Portal" title="พอร์ทัลอคาเดมี" intro="จัดการทุกอย่างของอคาเดมีและใบอนุญาต FAT ได้ในที่เดียว" points={POINTS}>
      <Link href="/academies" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" />
        ทำเนียบอคาเดมี
      </Link>
      <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">เข้าสู่ระบบ</h2>
      <p className="mt-2 text-sm text-slate-500">สำหรับผู้ดูแลอคาเดมี และเจ้าหน้าที่สมาคมฯ</p>

      {error && ERRORS[error] && (
        <p role="alert" className="mt-6 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          <AlertCircle className="h-4 w-4 flex-none" />
          {ERRORS[error]}
        </p>
      )}

      <form action={academyLogin} className="mt-8 space-y-5">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">อีเมล</span>
          <span className="relative mt-1.5 block">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
            <input name="email" type="email" required autoComplete="email" placeholder="name@academy.com" className={authInputClass} />
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">รหัสผ่าน</span>
          <span className="mt-1.5 block">
            <PasswordInput name="password" autoComplete="current-password" />
          </span>
        </label>
        <LoginSubmit />
      </form>
      <details className="group mt-4 text-sm">
        <summary className="cursor-pointer list-none text-right font-semibold text-indigo-600 hover:text-indigo-800">ลืมรหัสผ่าน?</summary>
        <p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          ติดต่อฝ่ายเทคนิคของสมาคมฯ แจ้งชื่ออคาเดมีและอีเมลที่ใช้สมัคร — เจ้าหน้าที่จะตั้งรหัสผ่านใหม่ให้
        </p>
      </details>

      <div className="mt-10 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        ยังไม่มีบัญชี?
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <Link
        href="/academies/register"
        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800"
      >
        <UserPlus className="h-4 w-4" />
        สมัครบัญชีอคาเดมี
      </Link>
    </AuthShell>
  );
}
