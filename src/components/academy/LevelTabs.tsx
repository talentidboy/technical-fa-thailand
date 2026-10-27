"use client";

import { useState, type ReactNode } from "react";
import theme from "./public.module.css";

// แท็บเลือกระดับ: ปุ่มด้านบน · แสดงเฉพาะการ์ดของระดับที่เลือก (ระดับอื่นไม่แสดง)
export function LevelTabs({ items }: { items: { key: string; tab: ReactNode; panel: ReactNode }[] }) {
  const [active, setActive] = useState(items[0].key);
  const current = items.find((it) => it.key === active) ?? items[0];
  return (
    <div>
      <div role="tablist" aria-label="เลือกระดับ" className="grid grid-cols-3 gap-2 sm:gap-4">
        {items.map((it) => {
          const on = it.key === current.key;
          return (
            <button
              key={it.key}
              type="button"
              role="tab"
              id={`level-tab-${it.key}`}
              aria-selected={on}
              aria-controls={`level-panel-${it.key}`}
              onClick={() => setActive(it.key)}
              className={`rounded-2xl text-left transition-all duration-200 ${
                on ? "-translate-y-1 bg-white text-(--ink) shadow-[5px_5px_0_var(--ink)] ring-2 ring-(--ink)" : "bg-white/15 text-(--ink) ring-2 ring-transparent hover:bg-white/35"
              }`}
            >
              {it.tab}
            </button>
          );
        })}
      </div>
      <div key={current.key} role="tabpanel" id={`level-panel-${current.key}`} aria-labelledby={`level-tab-${current.key}`} className={`${theme.fadeIn} mt-8`}>
        {current.panel}
      </div>
    </div>
  );
}
