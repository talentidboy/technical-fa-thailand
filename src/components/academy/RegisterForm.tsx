"use client";

import { useState } from "react";
import { Building2, Plus, UserPlus } from "lucide-react";
import { ResultForm } from "@/components/ResultForm";
import { registerAcademy } from "@/app/academies/account-actions";
import { fieldClass as field } from "./AcademyShell";
import { AcademyPicker, type PickerAcademy } from "./AcademyPicker";

function Input({ label, name, type = "text", required, placeholder, autoComplete }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string; autoComplete?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input name={name} type={type} required={required} placeholder={placeholder} autoComplete={autoComplete} className={field} />
    </label>
  );
}

// สมัครบัญชีอคาเดมี: เลือก "อคาเดมีใหม่" หรือ "มีในทะเบียนแล้ว" (ค้นหาแล้วเลือก)
export function RegisterForm({ academies, provinces }: { academies: PickerAcademy[]; provinces: string[] }) {
  const [mode, setMode] = useState<"new" | "existing">("new");

  return (
    <ResultForm action={registerAcademy} className="space-y-6">
      <input type="hidden" name="mode" value={mode} />
      <div role="radiogroup" aria-label="ประเภทการสมัคร" className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["new", Plus, "อคาเดมีใหม่", "ยังไม่เคยอยู่ในทะเบียนของสมาคมฯ — เริ่มใช้งานได้ทันที"],
            ["existing", Building2, "มีในทะเบียนแล้ว", "ขอสิทธิ์ดูแลอคาเดมีที่ได้รับการรับรองแล้ว — รอสมาคมฯ อนุมัติ"],
          ] as const
        ).map(([value, Icon, title, desc]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => setMode(value)}
            className={`flex gap-3 rounded-2xl p-4 text-left ring-2 transition-colors ${mode === value ? "bg-indigo-50 ring-indigo-500" : "bg-white ring-slate-200 hover:ring-slate-300"}`}
          >
            <Icon className={`mt-0.5 h-5 w-5 flex-none ${mode === value ? "text-indigo-600" : "text-slate-400"}`} />
            <span>
              <span className="block font-semibold text-slate-900">{title}</span>
              <span className="block text-xs text-slate-500">{desc}</span>
            </span>
          </button>
        ))}
      </div>

      {mode === "new" ? (
        <fieldset className="grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm font-semibold text-slate-700">ข้อมูลอคาเดมี</legend>
          <Input label="ชื่ออคาเดมี (อังกฤษ)" name="nameEn" required placeholder="Example Football Academy" />
          <Input label="ชื่ออคาเดมี (ไทย)" name="nameTh" placeholder="เอ็กแซมเปิล ฟุตบอล อคาเดมี" />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              จังหวัด<span className="text-red-500"> *</span>
            </span>
            <select name="province" required defaultValue="" className={field}>
              <option value="" disabled>
                เลือกจังหวัด
              </option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <Input label="สโมสรต้นสังกัด (ถ้ามี)" name="parentClub" />
          <div className="sm:col-span-2">
            <Input label="ที่อยู่ / สนามฝึก" name="address" />
          </div>
        </fieldset>
      ) : (
        <fieldset className="rounded-2xl bg-slate-50 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-700">เลือกอคาเดมีของคุณ</legend>
          <AcademyPicker name="academyId" academies={academies} emptyHint="ไม่พบชื่อนี้ในทะเบียน — ถ้ายังไม่เคยได้รับการรับรอง ให้เลือก “อคาเดมีใหม่”" />
          <label className="mt-3 flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">ข้อความถึงสมาคมฯ (ช่วยให้อนุมัติเร็วขึ้น)</span>
            <textarea name="note" rows={2} placeholder="เช่น เป็นผู้อำนวยการอคาเดมี เบอร์ติดต่อ..." className={field} />
          </label>
        </fieldset>
      )}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold text-slate-700">ผู้ดูแลบัญชี</legend>
        <Input label="ชื่อ-สกุล" name="name" required autoComplete="name" />
        <Input label="ตำแหน่งในอคาเดมี" name="position" placeholder="เช่น ผู้อำนวยการ" />
        <Input label="เบอร์โทรศัพท์" name="phone" type="tel" autoComplete="tel" />
        <Input label="อีเมล (ใช้เข้าสู่ระบบ)" name="email" type="email" required autoComplete="email" />
        <Input label="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)" name="password" type="password" required autoComplete="new-password" />
        <Input label="ยืนยันรหัสผ่าน" name="password2" type="password" required autoComplete="new-password" />
      </fieldset>

      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input type="checkbox" name="consent" required className="mt-0.5 h-5 w-5 flex-none rounded border-slate-300" />
        ยินยอมให้สมาคมฯ ใช้ข้อมูลที่กรอกเพื่อการพิจารณาและบริหารใบอนุญาตอคาเดมี (ข้อมูลติดต่อไม่แสดงต่อสาธารณะ)
      </label>
      <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b1220] px-5 py-3 text-sm font-bold text-white hover:bg-[#1e96dc]">
        <UserPlus className="h-4 w-4" />
        สมัครบัญชี
      </button>
    </ResultForm>
  );
}
