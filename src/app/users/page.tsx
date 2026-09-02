import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createSystemUser, deleteSystemUser } from "./actions";
import { Field, SelectField } from "@/components/FormField";
import { ADMIN_STAFF_ROLES } from "@/lib/constants";
import { LOGO_URL } from "@/lib/brand";
import { UserPlus, Trash2, ShieldCheck, ArrowLeft } from "lucide-react";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== "ADMIN") redirect("/");

  const { error } = await searchParams;
  const errorMessage = error === "invalid_input" ? "กรุณากรอกอีเมลและรหัสผ่านอย่างน้อย 8 ตัวอักษร" : null;

  const users = await prisma.systemUser.findMany({
    where: { role: { in: ["ADMIN", "STAFF"] } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm font-bold text-white">
                FA Thailand Technical
              </p>
              <p className="text-[11px] text-indigo-300">
                ตั้งค่าระดับองค์กร: ผู้ใช้งานระบบ
              </p>
            </div>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าแรก
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            ผู้ใช้งานระบบ
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            จัดการสิทธิ์การเข้าใช้งานระดับองค์กร — เฉพาะบัญชีผู้ดูแลระบบและเจ้าหน้าที่เท่านั้น
            (บัญชีผู้ฝึกสอนจัดการแยกที่{" "}
            <Link href="/coaches/accounts" className="font-medium text-indigo-600 hover:text-indigo-700">
              หมวดศูนย์อบรมผู้ฝึกสอนฟุตบอล
            </Link>
            )
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <UserPlus className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">เพิ่มผู้ใช้งานใหม่</h2>
          </div>
          <form
            action={createSystemUser}
            className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <Field label="อีเมล" name="email" type="email" required />
            <Field
              label="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)"
              name="password"
              type="password"
              required
            />
            <SelectField
              label="สิทธิ์การใช้งาน"
              name="role"
              options={ADMIN_STAFF_ROLES}
              required
            />
            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2 lg:col-span-3">
                {errorMessage}
              </div>
            )}
            <div className="sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
              >
                <UserPlus className="h-4 w-4" />
                เพิ่มผู้ใช้งาน
              </button>
            </div>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">อีเมล</th>
                  <th className="px-6 py-3.5">สิทธิ์</th>
                  <th className="px-6 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-3.5 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        {u.id === currentUser.id && (
                          <ShieldCheck className="h-4 w-4 text-indigo-500" />
                        )}
                        {u.email}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {u.role === "ADMIN" ? "ผู้ดูแลระบบ" : "เจ้าหน้าที่"}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {u.id !== currentUser.id && (
                        <form action={deleteSystemUser}>
                          <input type="hidden" name="id" value={u.id} />
                          <button
                            type="submit"
                            aria-label="ลบผู้ใช้งาน"
                            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
