"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

const STORAGE_KEY = "calendar-color-presets";

function loadPresets(seed: string[]): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore malformed/unavailable localStorage
  }
  return seed;
}

function savePresets(presets: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // ignore unavailable localStorage (e.g. private mode)
  }
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
  const [presets, setPresets] = useState<string[]>(seedColors);

  useEffect(() => {
    setPresets(loadPresets(seedColors));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addPreset() {
    setPresets((prev) => {
      if (prev.some((c) => c.toLowerCase() === value.toLowerCase())) return prev;
      const next = [...prev, value];
      savePresets(next);
      return next;
    });
  }

  function removePreset(color: string) {
    setPresets((prev) => {
      const next = prev.filter((c) => c !== color);
      savePresets(next);
      return next;
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
