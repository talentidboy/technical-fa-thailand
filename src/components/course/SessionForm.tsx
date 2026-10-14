"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus, Save } from "lucide-react";
import { openCourseSession, updateCourseSession, type FormResult } from "@/app/(admin)/course-sessions/actions";

const input =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

function F({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

export type SessionDefaults = {
  id: number;
  name: string;
  venue: string;
  capacity: string;
  startDate: string;
  endDate: string;
  applicationOpenDate: string;
  applicationDeadline: string;
};

const LEVELS = ["G", "C", "B", "A", "PRO"];

// ฟอร์มเปิดรุ่นอบรมใหม่ (เลือกระดับ → ระบบสร้างหลักสูตรให้เอง) และใช้แก้ไขรายละเอียดรุ่นเดิม (ส่ง defaults มา)
export function SessionForm({
  generalCourses = [],
  defaults,
  suggestedName,
}: {
  generalCourses?: { id: number; title: string }[];
  defaults?: SessionDefaults;
  suggestedName?: string;
}) {
  const editing = Boolean(defaults);
  const [state, action, pending] = useActionState<FormResult, FormData>(
    editing ? updateCourseSession : openCourseSession,
    null,
  );
  const [course, setCourse] = useState("C");

  return (
    <form action={action} className="space-y-5">
      {defaults && <input type="hidden" name="id" value={defaults.id} />}
      {state && !state.ok && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          บันทึกแล้ว
        </p>
      )}

      {!editing && (
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            หลักสูตร <span className="text-red-500">*</span>
          </p>
          <div className="grid grid-cols-5 gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setCourse(l)}
                aria-pressed={course === l}
                className={`rounded-xl border px-2 py-3 text-center transition-colors ${
                  course === l
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                    : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                }`}
              >
                <span className="block text-lg font-black leading-none">{l}</span>
                <span className={`mt-1 block text-[10px] ${course === l ? "text-indigo-100" : "text-slate-400"}`}>
                  {l === "G" ? "Grassroots" : "AFC License"}
                </span>
              </button>
            ))}
          </div>
          <select
            value={LEVELS.includes(course) ? "" : course}
            onChange={(e) => setCourse(e.target.value || "C")}
            className={`${input} mt-2 ${LEVELS.includes(course) ? "text-slate-400" : ""}`}
            aria-label="หรือเลือกหลักสูตรอบรมทั่วไป"
          >
            <option value="">หรือ อบรมทั่วไป (ไม่ออกใบอนุญาต)...</option>
            {generalCourses.map((c) => (
              <option key={c.id} value={`course:${c.id}`}>
                {c.title}
              </option>
            ))}
            <option value="general:new">+ หลักสูตรอบรมทั่วไปใหม่</option>
          </select>
          <input type="hidden" name="course" value={course} />
          {course === "general:new" && (
            <input name="generalTitle" required placeholder="ชื่อหลักสูตร เช่น Futsal Level 1" className={`${input} mt-2`} />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <F label="ชื่อรุ่น" required>
          <input
            name="name"
            required
            defaultValue={defaults?.name ?? suggestedName}
            placeholder="รุ่นที่ 1/2569"
            className={input}
          />
        </F>
        <F label="สถานที่อบรม">
          <input name="venue" defaultValue={defaults?.venue} placeholder="เช่น สนามศุภชลาศัย" className={input} />
        </F>
        <F label="รับกี่คน">
          <input
            name="capacity"
            type="number"
            min={1}
            defaultValue={defaults?.capacity}
            placeholder="ไม่จำกัด"
            className={input}
          />
        </F>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
        <F label="รับสมัคร ตั้งแต่">
          <input name="applicationOpenDate" type="date" defaultValue={defaults?.applicationOpenDate} className={input} />
        </F>
        <F label="ถึงวันที่">
          <input name="applicationDeadline" type="date" defaultValue={defaults?.applicationDeadline} className={input} />
        </F>
        <F label="อบรม ตั้งแต่">
          <input name="startDate" type="date" defaultValue={defaults?.startDate} className={input} />
        </F>
        <F label="ถึงวันที่">
          <input name="endDate" type="date" defaultValue={defaults?.endDate} className={input} />
        </F>
      </div>

      {!editing && (
        <F label="คุณสมบัติผู้สมัคร (ถ้ามี)">
          <input name="requirement" placeholder="เช่น ถือใบอนุญาตระดับ C มาแล้วไม่น้อยกว่า 1 ปี" className={input} />
        </F>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:opacity-60 sm:w-auto"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : editing ? (
          <Save className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {editing ? "บันทึก" : "เปิดรับสมัครรุ่นนี้"}
      </button>
    </form>
  );
}
