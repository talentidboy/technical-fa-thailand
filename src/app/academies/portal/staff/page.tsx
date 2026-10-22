import type { Metadata } from "next";
import type { AcademyStaff } from "@/generated/prisma/client";
import { requireAcademy } from "@/lib/academy-portal";
import { loadStaff } from "@/lib/academy-data";
import { LICENCE_LEVELS, STAFF_ROLES } from "@/lib/academy-checks";
import { ResultForm } from "@/components/ResultForm";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { TextField, fieldClass } from "@/components/academy/AcademyShell";
import { addStaff, deleteStaff, updateStaff } from "../actions";
import { BadgeCheck, Pencil, Plus, Save, Trash2, TriangleAlert } from "lucide-react";

export const metadata: Metadata = { title: "บุคลากร | พอร์ทัลอคาเดมี" };

function StaffFields({ staff }: { staff?: AcademyStaff }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">
          หน้าที่<span className="text-red-500"> *</span>
        </span>
        <select name="role" required defaultValue={staff?.role ?? ""} className={fieldClass}>
          <option value="" disabled>
            เลือกหน้าที่
          </option>
          {Object.entries(STAFF_ROLES).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <TextField label="ชื่อ-สกุล" name="name" defaultValue={staff?.name} hint="เว้นว่างได้ถ้ากรอก AFC ID — ระบบใช้ชื่อจากฐานข้อมูลผู้ฝึกสอน" />
      <div className="flex flex-col gap-1.5">
        <TextField
          label="AFC ID หรือเลขที่ใบอนุญาตผู้ฝึกสอน"
          name="coachRef"
          hint={staff?.coachId ? "ผูกกับฐานข้อมูลผู้ฝึกสอนแล้ว — กรอกใหม่เพื่อเปลี่ยนคน" : "ใช้ยืนยันระดับใบอนุญาตจากฐานข้อมูลของสมาคมฯ"}
        />
        {staff?.coachId && (
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input type="checkbox" name="unlinkCoach" className="h-3.5 w-3.5 rounded border-slate-300" />
            ยกเลิกการผูกกับฐานข้อมูลผู้ฝึกสอน
          </label>
        )}
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">ใบอนุญาตผู้ฝึกสอน (ที่แจ้ง)</span>
        <select name="licence" defaultValue={staff?.licence ?? ""} className={fieldClass}>
          <option value="">ไม่มี</option>
          {Object.entries(LICENCE_LEVELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <TextField label="เบอร์โทรศัพท์" name="phone" type="tel" defaultValue={staff?.phone} />
      <TextField label="อีเมล" name="email" type="email" defaultValue={staff?.email} />
    </div>
  );
}

export default async function PortalStaffPage() {
  const { member } = await requireAcademy();
  const staff = await loadStaff(member.academyId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">บุคลากร</h1>
        <p className="mt-1 text-sm text-slate-500">
          หัวหน้าอคาเดมี ผู้ฝึกสอน และเจ้าหน้าที่ — ใช้ตรวจเกณฑ์ข้อ 1.1.3 และ 1.3.1 · กรอก AFC ID หรือเลขที่ใบอนุญาตเพื่อให้ระบบยืนยันระดับใบอนุญาตจากฐานข้อมูลของสมาคมฯ
        </p>
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        {staff.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-400">ยังไม่มีรายชื่อบุคลากร</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {staff.map((s) => (
              <li key={s.id}>
                <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500">
                      {STAFF_ROLES[s.role] ?? s.role}
                      {s.licence && ` · แจ้ง ${LICENCE_LEVELS[s.licence] ?? s.licence}`}
                    </p>
                  </div>
                  {s.coachId &&
                    (s.verifiedLicence ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        ยืนยันแล้ว {LICENCE_LEVELS[s.verifiedLicence]}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        <TriangleAlert className="h-3.5 w-3.5" />
                        ไม่พบใบ C/B/A ที่ยังไม่หมดอายุ
                      </span>
                    ))}
                  <ResultForm action={deleteStaff} quiet>
                    <input type="hidden" name="id" value={s.id} />
                    <ConfirmSubmit message={`ลบ ${s.name} ออกจากรายชื่อใช่ไหม?`} ariaLabel={`ลบ ${s.name}`} className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </ConfirmSubmit>
                  </ResultForm>
                </div>
                <details className="border-t border-slate-100">
                  <summary className="flex cursor-pointer items-center gap-1.5 px-5 py-2 text-xs font-semibold text-indigo-600 hover:bg-slate-50">
                    <Pencil className="h-3.5 w-3.5" />
                    แก้ไข
                  </summary>
                  <ResultForm action={updateStaff} className="border-t border-slate-100 p-5">
                    <input type="hidden" name="id" value={s.id} />
                    <StaffFields staff={s} />
                    <button type="submit" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800">
                      <Save className="h-4 w-4" />
                      บันทึก
                    </button>
                  </ResultForm>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-900">เพิ่มบุคลากร</h2>
        <ResultForm action={addStaff} resetOnSuccess successText="เพิ่มแล้ว" className="mt-4">
          <StaffFields />
          <button type="submit" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800">
            <Plus className="h-4 w-4" />
            เพิ่มบุคลากร
          </button>
        </ResultForm>
      </section>
    </div>
  );
}
