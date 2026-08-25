"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

export function RoundField({
  existingRounds,
  defaultValue,
}: {
  existingRounds: string[];
  defaultValue?: string;
}) {
  const startInSelectMode = existingRounds.length > 0 && (!defaultValue || existingRounds.includes(defaultValue));
  const [mode, setMode] = useState<"select" | "new">(startInSelectMode ? "select" : "new");

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">
        รอบการแข่งขัน<span className="text-red-500"> *</span>
      </span>
      <div className="flex items-center gap-1.5">
        {mode === "select" ? (
          <select
            name="round"
            required
            defaultValue={defaultValue ?? ""}
            className="w-full flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">เลือกรอบ...</option>
            {existingRounds.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ) : (
          <input
            name="round"
            required
            defaultValue={existingRounds.includes(defaultValue ?? "") ? "" : (defaultValue ?? "")}
            placeholder="ภาคใต้ / กลุ่ม A - นัดที่ 1 / รอบรองชนะเลิศ"
            className="w-full flex-1 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        )}
        <button
          type="button"
          onClick={() => setMode((m) => (m === "select" ? "new" : "select"))}
          title={mode === "select" ? "เพิ่มรอบใหม่" : "เลือกจากรายการเดิม"}
          aria-label={mode === "select" ? "เพิ่มรอบใหม่" : "เลือกจากรายการเดิม"}
          className="flex-none rounded-lg border border-slate-200 p-2.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-rose-600"
        >
          {mode === "select" ? <Plus className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}
