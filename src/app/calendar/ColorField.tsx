"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useStoredValue } from "./useStoredValue";

const STORAGE_KEY = "calendar-color-presets";

function isNonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string");
}

export default function ColorField({
  name,
  defaultValue = "#4A86E8",
  seedColors,
}: {
  name: string;
  defaultValue?: string;
  seedColors: string[];
}) {
  const [value, setValue] = useState(defaultValue);
  const [presets, updatePresets] = useStoredValue(STORAGE_KEY, seedColors, isNonEmptyStringArray);

  function addPreset() {
    updatePresets((prev) => {
      if (prev.some((c) => c.toLowerCase() === value.toLowerCase())) return prev;
      return [...prev, value];
    });
  }

  function removePreset(color: string) {
    updatePresets((prev) => {
      return prev.filter((c) => c !== color);
    });
  }

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">สี</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {presets.map((c) => (
          <div key={c} className="group relative">
            <button
              type="button"
              onClick={() => setValue(c)}
              style={{ backgroundColor: c }}
              title={c}
              className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                value.toLowerCase() === c.toLowerCase()
                  ? "border-indigo-600"
                  : "border-white ring-1 ring-slate-200"
              }`}
            />
            <button
              type="button"
              onClick={() => removePreset(c)}
              title="ลบสีนี้ออกจากรายการพื้นฐาน"
              className="absolute -right-1 -top-1 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-700 text-white group-hover:flex"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addPreset}
          title="เพิ่มสีปัจจุบันเป็นสีพื้นฐาน"
          className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 transition-colors hover:border-indigo-400 hover:text-indigo-500"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <input
          name={name}
          type="color"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          title="กำหนดสีเอง"
          className="h-9 w-9 flex-none rounded-lg border border-slate-200 p-1"
        />
      </div>
    </label>
  );
}
