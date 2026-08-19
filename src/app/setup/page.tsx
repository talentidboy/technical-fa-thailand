import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createFirstAdmin } from "./actions";
import { LOGO_URL } from "@/lib/brand";

export default async function SetupPage() {
  const userCount = await prisma.systemUser.count();
  if (userCount > 0) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 bg-linear-to-r from-amber-500 via-amber-300 to-amber-500" />
        <div className="p-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl shadow-sm ring-4 ring-amber-400/30"
            />
            <h1 className="mt-2 text-lg font-bold text-slate-900">
              ตั้งค่าผู้ดูแลระบบคนแรก
            </h1>
            <p className="text-sm text-slate-500">
              ยังไม่มีผู้ใช้งานในระบบ — สร้างบัญชี Admin เพื่อเริ่มใช้งาน
            </p>
          </div>

          <form action={createFirstAdmin} className="mt-6 space-y-4">
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
                รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)
              </span>
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
              สร้างบัญชี Admin
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
