"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { createEvent } from "./actions";
import { Field, SelectField } from "@/components/FormField";
import ColorField from "./ColorField";
import { useManagedList } from "./useManagedList";

const DEFAULT_TEAM_SCOPES = ["Men", "Both", "Women", "Coach Education"];

type CategoryRow = { category: string; color: string };

export default function AddEventButton({
  categoryRows,
}: {
  categoryRows: CategoryRow[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const seedColors = Array.from(new Set(categoryRows.map((c) => c.color)));
  const teamScopeList = useManagedList("calendar-team-scope-options", DEFAULT_TEAM_SCOPES);
  const teamScopeOptions = teamScopeList.items.map((v) => ({ value: v, label: v }));

  function handleCreate() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    startTransition(async () => {
      await createEvent(fd);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex flex-none items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
      >
        <Plus className="h-4 w-4" />
        เพิ่มกิจกรรม
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">เพิ่มกิจกรรมใหม่</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form ref={formRef} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="ชื่อกิจกรรม" name="title" required placeholder="เช่น U17M Camp" />
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">
                  หมวดหมู่ <span className="text-red-500">*</span>
                </span>
                <input
                  name="category"
                  required
                  placeholder="เช่น FIFA DAY"
                  list="add-event-category-suggestions"
                  className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <datalist id="add-event-category-suggestions">
                  {categoryRows.map((c) => (
                    <option key={c.category} value={c.category} />
                  ))}
                </datalist>
              </label>
              <ColorField name="color" defaultValue="#4A86E8" seedColors={seedColors} />
              <SelectField label="กลุ่มทีม" name="teamScope" required options={teamScopeOptions} />
              <Field label="วันเริ่ม" name="startDate" type="date" required />
              <Field label="วันจบ (เว้นว่าง = วันเดียว)" name="endDate" type="date" />
              <div className="sm:col-span-2">
                <Field label="ลิงก์อ้างอิง (ถ้ามี)" name="sourceUrl" placeholder="https://..." />
              </div>
            </form>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {pending ? "กำลังเพิ่ม..." : "เพิ่มกิจกรรม"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
