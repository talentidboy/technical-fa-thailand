import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { verifyRegistrationOtp, resendRegistrationOtp } from "../actions";
import { LOGO_URL, COVER_URL } from "@/lib/brand";
import { ArrowLeft, MailCheck } from "lucide-react";

export default async function VerifyRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; sent?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect(currentUser.role === "COACH" ? "/me" : "/");
  }

  const { email, error, sent } = await searchParams;
  if (!email) redirect("/register");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0">
        <Image
          src={COVER_URL}
          alt="สำนักงานสมาคมกีฬาฟุตบอลแห่งประเทศไทย"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-br from-indigo-950/90 via-indigo-900/85 to-indigo-700/90" />
      </div>
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-600 via-amber-400 to-amber-600" />

      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="h-1.5 bg-linear-to-r from-amber-500 via-amber-300 to-amber-500" />
        <div className="p-8">
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            กลับไปแก้ไขข้อมูล
          </Link>

          <div className="mt-4 flex flex-col items-center gap-2 text-center">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl shadow-sm ring-4 ring-amber-400/30"
            />
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <MailCheck className="h-5 w-5" />
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-900">ยืนยันอีเมล</h2>
            <p className="text-sm text-slate-500">
              ส่งรหัสยืนยัน 6 หลักไปที่ <span className="font-medium text-slate-700">{email}</span> แล้ว
              กรุณากรอกรหัสภายใน 10 นาที
            </p>
          </div>

          {sent && (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-600">
              ส่งรหัสยืนยันใหม่แล้ว
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">{error}</p>
          )}

          <form action={verifyRegistrationOtp} className="mt-6 space-y-4">
            <input type="hidden" name="email" value={email} />
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">รหัสยืนยัน 6 หลัก</span>
              <input
                name="code"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-center text-2xl font-bold tracking-[0.5em] focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
            >
              ยืนยันและสร้างบัญชี
            </button>
          </form>

          <form action={resendRegistrationOtp} className="mt-3">
            <input type="hidden" name="email" value={email} />
            <button type="submit" className="w-full text-center text-sm font-medium text-indigo-600 hover:text-indigo-700">
              ส่งรหัสยืนยันอีกครั้ง
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
