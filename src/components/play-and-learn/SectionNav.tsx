"use client";

import { useEffect, useRef, useState } from "react";

// แถบลิงก์ไปแต่ละหัวข้อ — ไฮไลต์หัวข้อที่กำลังอ่านอยู่ และเลื่อนปุ่มนั้นมาให้เห็นบนจอมือถือ
export function SectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState<string | null>(null);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const { id } of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    const el = bar.current;
    const chip = el?.querySelector<HTMLElement>(`[data-section="${active}"]`);
    if (el && chip) el.scrollTo({ left: chip.offsetLeft - el.clientWidth / 2 + chip.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  return (
    <nav aria-label="หัวข้อในหน้านี้" className="border-t border-pink-100/80">
      <div ref={bar} className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:px-6">
        {sections.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            data-section={id}
            aria-current={active === id ? "true" : undefined}
            className={`flex-none rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
              active === id ? "bg-linear-to-r from-pink-400 to-purple-400 text-white shadow-sm shadow-pink-200" : "text-purple-700 hover:bg-pink-50"
            }`}
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}
