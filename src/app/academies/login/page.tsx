import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAcademyUser, getCurrentUser } from "@/lib/auth";
import { AcademyTopBar, TextField } from "@/components/academy/AcademyShell";
import { academyLogin } from "../account-actions";
import { ArrowLeft, LogIn, ShieldCheck, UserPlus } from "lucide-react";

export const metadata: Metadata = { title: "เข้าสู่ระบบอคาเดมี | Academy Licensing" };

const ERRORS: Record<string, string> = {
  "1": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  disabled: "บัญชีนี้ถูกระงับการใช้งาน — โปรดติดต่อสมาคมฯ",
  coach: "บัญชีผู้ฝึกสอนเข้าสู่ระบบที่ศูนย์อบรมผู้ฝึกสอน",
};

export default async function AcademyLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAcademyUser()) redirect("/academies/portal");
  const staff = await getCurrentUser();
  if (staff && (staff.role === "ADMIN" || staff.role === "STAFF")) redirect("/academies/manage");
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-slate-50">
      <AcademyTopBar subtitle="เข้าสู่ระบบสำหรับอคาเดมี">
        <Link href="/academies" className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm text-indigo-200 hover:bg-white/10">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">ทำเนียบอคาเดมี</span>
        </Link>
      </AcademyTopBar>
      <main className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2">
        <section className="hidden lg:block">
          <ShieldCheck className="h-12 w-12 text-amber-500" />
          <h1 className="mt-4 text-3xl font-extrabold text-slate-900">พอร์ทัลอคาเดมี</h1>
          <p className="mt-3 text-slate-600">จัดการข้อมูลอคาเดมี บุคลากร ทีมและนักเตะ ยื่นขอใบอนุญาต ต่ออายุ หรือเลื่อนระดับ และติดตามผลการตรวจได้ในที่เดียว</p>
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">เข้าสู่ระบบ</h2>
          {error && ERRORS[error] && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{ERRORS[error]}</p>}
          <form action={academyLogin} className="mt-5 space-y-4">
            <TextField label="อีเมล" name="email" type="email" required autoComplete="email" />
            <TextField label="รหัสผ่าน" name="password" type="password" required autoComplete="current-password" />
            <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-700 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-800">
              <LogIn className="h-4 w-4" />
              เข้าสู่ระบบ
            </button>
          </form>
          <p className="mt-4 text-xs text-slate-500">ลืมรหัสผ่าน: ติดต่อฝ่ายเทคนิคของสมาคมฯ เพื่อตั้งรหัสผ่านใหม่</p>
          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-sm text-slate-600">ยังไม่มีบัญชี?</p>
            <Link
              href="/academies/register"
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 px-5 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              <UserPlus className="h-4 w-4" />
              สมัครบัญชีอคาเดมี
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
