import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createCenter, updateCenter, deleteCenter } from "./actions";
import { Field } from "@/components/FormField";
import { LOGO_URL } from "@/lib/brand";
import { ArrowLeft, Plus, Trash2, Save, MapPin } from "lucide-react";

const textareaClass =
  "rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

export default async function PlayAndLearnManagePage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    redirect("/play-and-learn");
  }

  const centers = await prisma.playAndLearnCenter.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <Link href="/play-and-learn" className="flex items-center gap-2">
            <Image src={LOGO_URL} alt="FA Thailand" width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />
            <div>
              <p className="text-sm font-bold text-white">FA Thailand Technical</p>
              <p className="text-[11px] text-indigo-300">จัดการศูนย์ฝึก Play and Learn</p>
            </div>
          </Link>
          <Link
            href="/play-and-learn"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้า Play and Learn
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จัดการศูนย์ฝึกกิจกรรม</h1>
          <p className="mt-1 text-sm text-slate-500">
            แก้ไขข้อมูลศูนย์ฝึก โค้ช ผู้ประสานงาน ตารางเวลา และลิงก์รับสมัครของแต่ละศูนย์
          </p>
        </div>

        {/* เพิ่มศูนย์ฝึกใหม่ */}
        <details className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer items-center gap-2 px-6 py-4 text-sm font-semibold text-slate-900">
            <Plus className="h-4 w-4 text-pink-500" />
            เพิ่มศูนย์ฝึกใหม่
          </summary>
          <form action={createCenter} className="grid grid-cols-1 gap-4 border-t border-slate-100 p-6 sm:grid-cols-2">
            <Field label="ชื่อศูนย์ฝึก" name="name" required placeholder="CHR Football Academy" />
            <Field label="จังหวัด (ไทย)" name="province" required placeholder="กรุงเทพมหานคร" />
            <Field label="จังหวัด (English)" name="provinceEn" required placeholder="Bangkok" />
            <Field label="เบอร์โทร" name="tel" required placeholder="098-426-3341" />
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                ที่อยู่<span className="text-red-500"> *</span>
              </span>
              <textarea name="address" required rows={2} className={textareaClass} />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">โค้ช (1 คนต่อบรรทัด)</span>
              <textarea name="coaches" rows={2} placeholder={"นายก ข (ชื่อเล่น)\nนางสาว ค ง (ชื่อเล่น)"} className={textareaClass} />
            </label>
            <Field label="ผู้ประสานงาน" name="coordinator" required placeholder="คุณบอลลูน" />
            <Field label="ลำดับการแสดง" name="sortOrder" type="number" placeholder="1" />
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">ตารางเวลา (แสดงเป็นป้ายในการ์ด ถ้ามี)</span>
              <textarea name="schedule" rows={2} className={textareaClass} />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">ลิงก์รับสมัคร (Google Form) — ถ้ายังไม่มี ปล่อยว่างไว้</span>
              <input name="registerUrl" type="url" placeholder="https://forms.gle/..." className={textareaClass} />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                เพิ่มศูนย์ฝึก
              </button>
            </div>
          </form>
        </details>

        {/* รายการศูนย์ฝึกที่มีอยู่ */}
        <div className="space-y-6">
          {centers.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-400">
              ยังไม่มีศูนย์ฝึก
            </p>
          ) : (
            centers.map((center) => (
              <div key={center.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-6 py-3.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-pink-500" />
                    <p className="font-semibold text-slate-900">{center.name}</p>
                  </div>
                  <form action={deleteCenter}>
                    <input type="hidden" name="id" value={center.id} />
                    <button
                      type="submit"
                      aria-label="ลบศูนย์ฝึกนี้"
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      ลบ
                    </button>
                  </form>
                </div>
                <form action={updateCenter} className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                  <input type="hidden" name="id" value={center.id} />
                  <Field label="ชื่อศูนย์ฝึก" name="name" required defaultValue={center.name} />
                  <Field label="จังหวัด (ไทย)" name="province" required defaultValue={center.province} />
                  <Field label="จังหวัด (English)" name="provinceEn" required defaultValue={center.provinceEn} />
                  <Field label="เบอร์โทร" name="tel" required defaultValue={center.tel} />
                  <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      ที่อยู่<span className="text-red-500"> *</span>
                    </span>
                    <textarea name="address" required rows={2} defaultValue={center.address} className={textareaClass} />
                  </label>
                  <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className="text-sm font-medium text-slate-700">โค้ช (1 คนต่อบรรทัด)</span>
                    <textarea name="coaches" rows={2} defaultValue={center.coaches} className={textareaClass} />
                  </label>
                  <Field label="ผู้ประสานงาน" name="coordinator" required defaultValue={center.coordinator} />
                  <Field label="ลำดับการแสดง" name="sortOrder" type="number" defaultValue={String(center.sortOrder)} />
                  <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className="text-sm font-medium text-slate-700">ตารางเวลา (แสดงเป็นป้ายในการ์ด ถ้ามี)</span>
                    <textarea name="schedule" rows={2} defaultValue={center.schedule ?? ""} className={textareaClass} />
                  </label>
                  <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      ลิงก์รับสมัคร (Google Form) — ถ้ายังไม่มี ปล่อยว่างไว้ (ปุ่มจะแสดง &quot;เร็วๆ นี้&quot; แทน)
                    </span>
                    <input
                      name="registerUrl"
                      type="url"
                      placeholder="https://forms.gle/..."
                      defaultValue={center.registerUrl ?? ""}
                      className={textareaClass}
                    />
                  </label>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-lg bg-pink-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-pink-200 transition-colors hover:bg-pink-600"
                    >
                      <Save className="h-4 w-4" />
                      บันทึกการแก้ไข
                    </button>
                  </div>
                </form>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
