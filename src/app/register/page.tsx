import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { registerCoach } from "./actions";
import { LOGO_URL, COVER_URL } from "@/lib/brand";
import { ArrowLeft } from "lucide-react";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect(currentUser.role === "COACH" ? "/me" : "/");
  }

  const { error } = await searchParams;

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

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="h-1.5 bg-linear-to-r from-amber-500 via-amber-300 to-amber-500" />
        <div className="p-8">
          <Link
            href="/coach-center/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            กลับไปเข้าสู่ระบบ
          </Link>

          <div className="mt-4 flex flex-col items-center gap-2 text-center">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl shadow-sm ring-4 ring-amber-400/30"
            />
            <h2 className="mt-2 text-lg font-bold text-slate-900">
              FA Thailand Technical
            </h2>
            <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
              สมัครสมาชิกผู้ฝึกสอน
            </p>
            <p className="text-sm text-slate-500">
              ระบบจะยืนยันตัวตนกับข้อมูลผู้ฝึกสอนที่มีอยู่ในระบบอยู่แล้ว (นำเข้าโดยเจ้าหน้าที่) กรุณากรอกเลขบัตรประชาชนหรือ
              AFC ID พร้อมเบอร์โทรและวันเกิดให้ตรงกับข้อมูลเดิม
            </p>
          </div>

          <form action={registerCoach} className="mt-6 space-y-4">
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">ชื่อ (ไทย)</span>
                <input
                  name="nameTh"
                  required
                  autoFocus
                  className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">นามสกุล (ไทย)</span>
                <input
                  name="surnameTh"
                  required
                  className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            </div>
            <p className="text-xs text-slate-400">
              กรอกอย่างน้อย 1 ช่อง (เลขบัตรประชาชน หรือ AFC ID) เพื่อยืนยันตัวตนกับข้อมูลที่มีอยู่ในระบบ
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">เลขบัตรประชาชน</span>
                <input
                  name="idNumber"
                  inputMode="numeric"
                  maxLength={13}
                  placeholder="13 หลัก"
                  className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">AFC ID</span>
                <input
                  name="afcId"
                  placeholder="ถ้ามี"
                  className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">เบอร์โทรศัพท์</span>
                <input
                  name="telNo"
                  type="tel"
                  required
                  className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">วันเกิด</span>
                <input
                  name="dob"
                  type="date"
                  required
                  className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">อีเมล</span>
              <input
                name="email"
                type="email"
                required
                className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)</span>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
            >
              สมัครสมาชิก
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
