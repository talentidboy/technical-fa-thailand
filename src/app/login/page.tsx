import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { login } from "./actions";
import { LOGO_URL, COVER_URL } from "@/lib/brand";
import { ArrowLeft } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: "1" | "disabled" }>;
}) {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect(currentUser.role === "COACH" ? "/me" : "/");
  }

  const userCount = await prisma.systemUser.count();
  if (userCount === 0) {
    redirect("/setup");
  }

  const { error } = await searchParams;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
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
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            กลับหน้าแรก
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
              เข้าสู่ระบบ
            </p>
            <p className="text-sm text-slate-500">
              สำหรับผู้ดูแลระบบ เจ้าหน้าที่ และผู้ฝึกสอนทุกหมวด
            </p>
          </div>

          <form action={login} className="mt-6 space-y-4">
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error === "disabled"
                  ? "บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ"
                  : "อีเมลหรือรหัสผ่านไม่ถูกต้อง"}
              </p>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">
                อีเมล
              </span>
              <input
                name="email"
                type="email"
                required
                autoFocus
                className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">
                รหัสผ่าน
              </span>
              <input
                name="password"
                type="password"
                required
                className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
            >
              เข้าสู่ระบบ
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            ยังไม่มีบัญชี?{" "}
            <Link
              href="/register"
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              สมัครสมาชิกผู้ฝึกสอน
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
