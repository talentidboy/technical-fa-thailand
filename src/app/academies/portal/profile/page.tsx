import Image from "next/image";
import type { Metadata } from "next";
import { requireAcademy } from "@/lib/academy-portal";
import thailandMap from "@/lib/thailand-map.json";
import { ResultForm } from "@/components/ResultForm";
import { TextField, fieldClass } from "@/components/academy/AcademyShell";
import { updateProfile } from "../actions";
import { Save } from "lucide-react";

export const metadata: Metadata = { title: "ข้อมูลอคาเดมี | พอร์ทัลอคาเดมี" };

export default async function PortalProfilePage() {
  const { member } = await requireAcademy();
  const a = member.academy;
  const provinces = thailandMap.provinces.map((p) => p.th).sort((x, y) => x.localeCompare(y, "th"));

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
      <h1 className="text-xl font-bold text-slate-900">ข้อมูลอคาเดมี</h1>
      <p className="mt-1 text-sm text-slate-500">ชื่อ จังหวัด โลโก้ และเว็บไซต์ แสดงบนทำเนียบสาธารณะ — เบอร์โทรและอีเมลเห็นเฉพาะสมาคมฯ</p>
      <ResultForm action={updateProfile} className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="ชื่ออคาเดมี (อังกฤษ)" name="nameEn" required defaultValue={a.nameEn} />
          <TextField label="ชื่ออคาเดมี (ไทย)" name="nameTh" defaultValue={a.nameTh} />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">จังหวัด</span>
            <select name="province" defaultValue={a.province ?? ""} className={fieldClass}>
              <option value="">— ไม่ระบุ —</option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <TextField label="สโมสรต้นสังกัด" name="parentClub" defaultValue={a.parentClub} />
          <div className="sm:col-span-2">
            <TextField label="ที่อยู่ / สนามฝึก" name="address" defaultValue={a.address} />
          </div>
          <TextField label="ผู้ประสานงาน" name="contactName" defaultValue={a.contactName} />
          <TextField label="เบอร์โทรศัพท์" name="phone" type="tel" defaultValue={a.phone} />
          <TextField label="อีเมลอคาเดมี" name="email" type="email" defaultValue={a.email} />
          <TextField label="เว็บไซต์ / เพจ" name="website" type="url" defaultValue={a.website} placeholder="https://..." />
        </div>
        <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-slate-50 p-4">
          <span className="relative flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
            {a.logoUrl ? <Image src={a.logoUrl} alt="โลโก้อคาเดมี" fill sizes="64px" className="object-contain p-1" /> : <span className="text-xs text-slate-400">โลโก้</span>}
          </span>
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">โลโก้ (JPG / PNG / WEBP)</span>
            <input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className={`${fieldClass} file:mr-3 file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white`} />
          </label>
          {a.logoUrl && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="removeLogo" className="h-4 w-4 rounded border-slate-300" />
              ลบโลโก้
            </label>
          )}
        </div>
        <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800">
          <Save className="h-4 w-4" />
          บันทึกข้อมูล
        </button>
      </ResultForm>
    </section>
  );
}
