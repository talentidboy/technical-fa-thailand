"use client";

import { useEffect, useRef } from "react";
import { UserPlus, X } from "lucide-react";
import { Field, SelectField } from "@/components/FormField";
import { GENDER_OPTIONS } from "@/lib/constants";

export function AddCoachModal({
  action,
  autoOpen = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  autoOpen?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (autoOpen) dialogRef.current?.showModal();
  }, [autoOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
      >
        <UserPlus className="h-4 w-4" />
        เพิ่มผู้ฝึกสอนใหม่
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="m-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <UserPlus className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">เพิ่มผู้ฝึกสอนใหม่</h2>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="ปิด"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={action} className="max-h-[75vh] space-y-6 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
              <span className="text-sm font-medium text-slate-700">รูปถ่าย</span>
              <input
                name="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-600"
              />
            </label>
            <Field label="ชื่อ (ไทย)" name="nameTh" required placeholder="สมชาย" />
            <Field
              label="นามสกุล (ไทย)"
              name="surnameTh"
              required
              placeholder="ใจดี"
            />
            <Field label="ชื่อ (อังกฤษ)" name="nameEn" placeholder="Somchai" />
            <Field
              label="นามสกุล (อังกฤษ)"
              name="familyNameEn"
              placeholder="Jaidee"
            />
            <SelectField label="เพศ" name="gender" options={GENDER_OPTIONS} />
            <Field label="วันเกิด" name="dob" type="date" />
            <Field label="สัญชาติ" name="nationality" placeholder="ไทย" />
            <Field
              label="จังหวัดที่พำนัก"
              name="residence"
              placeholder="เชียงใหม่"
            />
            <Field label="AFC ID" name="afcId" placeholder="AFC/112170/THA" />
            <Field label="เลขบัตรประชาชน" name="idNumber" />
            <Field label="เลขพาสปอร์ต" name="passportNumber" />
            <Field
              label="อีเมล"
              name="email"
              type="email"
              placeholder="coach@example.com"
            />
            <Field label="เบอร์โทร" name="telNo" placeholder="08x-xxx-xxxx" />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
          >
            <UserPlus className="h-4 w-4" />
            เพิ่มผู้ฝึกสอน
          </button>
        </form>
      </dialog>
    </>
  );
}
