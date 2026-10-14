"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import { applyToCourse, type ApplyState } from "./actions";
import { GENDER_OPTIONS } from "@/lib/constants";

const input =
  "w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

function F({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
          {step}
        </span>
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

// ฟอร์มสมัครอบรม + สร้างบัญชีในครั้งเดียว — ถ้าส่งไม่ผ่าน ค่าที่กรอกไว้ยังอยู่ครบ (ยกเว้นรูปและรหัสผ่าน)
export function ApplyForm({ sessionId }: { sessionId: number }) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(applyToCourse, null);
  const v = state?.values ?? {};

  return (
    // key เปลี่ยนทุกครั้งที่มีผลตอบกลับ ให้ฟอร์มสร้างใหม่ด้วยค่าที่กรอกไว้ (React ล้างฟอร์มหลังส่งเสมอ)
    <form key={JSON.stringify(state)} action={action} className="space-y-7">
      <input type="hidden" name="sessionId" value={sessionId} />

      {state?.error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Section step={1} title="ยืนยันตัวตน">
        <F label="เลขบัตรประชาชน" required hint="ถ้าเคยมีประวัติในระบบ ระบบจะดึงใบอนุญาตเดิมมาให้อัตโนมัติ">
          <input
            name="idNumber"
            required
            inputMode="numeric"
            maxLength={17}
            placeholder="13 หลัก"
            defaultValue={v.idNumber}
            className={input}
          />
        </F>
        <F label="วันเกิด" required>
          <input name="dob" type="date" required defaultValue={v.dob} className={input} />
        </F>
        <F label="เบอร์โทรศัพท์" required>
          <input name="telNo" type="tel" required placeholder="08x-xxx-xxxx" defaultValue={v.telNo} className={input} />
        </F>
        <F label="เพศ">
          <select name="gender" defaultValue={v.gender ?? ""} className={`${input} bg-white`}>
            <option value="">เลือก...</option>
            {GENDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </F>
      </Section>

      <Section step={2} title="ชื่อ-นามสกุล">
        <F label="ชื่อ (ไทย)" required>
          <input name="nameTh" required placeholder="สมชาย" defaultValue={v.nameTh} className={input} />
        </F>
        <F label="นามสกุล (ไทย)" required>
          <input name="surnameTh" required placeholder="ใจดี" defaultValue={v.surnameTh} className={input} />
        </F>
        <F label="ชื่อ (อังกฤษ)" required hint="ใช้พิมพ์บนใบประกาศและบัตรใบอนุญาต">
          <input name="nameEn" required placeholder="Somchai" defaultValue={v.nameEn} className={input} />
        </F>
        <F label="นามสกุล (อังกฤษ)" required>
          <input name="familyNameEn" required placeholder="Jaidee" defaultValue={v.familyNameEn} className={input} />
        </F>
        <div className="sm:col-span-2">
          <F label="รูปถ่ายหน้าตรง" hint="ไฟล์ JPG หรือ PNG ไม่เกิน 5MB — ใช้บนบัตรใบอนุญาต (เพิ่มภายหลังได้)">
            <input
              name="photo"
              type="file"
              accept="image/jpeg,image/png"
              className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-600"
            />
          </F>
        </div>
      </Section>

      <Section step={3} title="ตั้งบัญชีเข้าสู่ระบบ">
        <F label="อีเมล" required hint="ใช้เข้าสู่ระบบเพื่อติดตามผลและดาวน์โหลดใบประกาศ">
          <input
            name="email"
            type="email"
            required
            placeholder="coach@example.com"
            defaultValue={v.email}
            className={input}
          />
        </F>
        <F label="รหัสผ่าน" required hint="อย่างน้อย 8 ตัวอักษร">
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className={input} />
        </F>
      </Section>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        {pending ? "กำลังส่งใบสมัคร..." : "ส่งใบสมัคร"}
      </button>
    </form>
  );
}
