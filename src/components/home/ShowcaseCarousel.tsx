"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./showcase.module.css";

export type Slide = { key: string; label: string; accent: string; node: React.ReactNode };

// สไลด์แนะนำหมวดงาน: เปลี่ยนเองทุก 7 วินาที (แถบความคืบหน้าใต้ชื่อหมวด = ตัวจับเวลา — เมื่อแถบวิ่งเต็มจึงเลื่อนไปหมวดถัดไป)
// ชี้เมาส์/โฟกัสอยู่ในสไลด์ = หยุดชั่วคราว · ปัดซ้ายขวาบนมือถือ · แถบชื่อหมวดครบ 7 หมวดทุกขนาดจอ (มือถือเลื่อนแนวนอน แถบเลื่อนตามหมวดที่เปิดอยู่) · ผู้ใช้ที่ตั้งค่าลดการเคลื่อนไหวจะไม่เลื่อนเอง (แถบไม่วิ่ง)
// ทุกสไลด์ซ้อนกันในช่องเดียว → ความสูงคงที่เท่าสไลด์ที่สูงที่สุด เนื้อหาด้านล่างไม่กระโดดตอนเปลี่ยนสไลด์
export function ShowcaseCarousel({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const go = (i: number) => setActive((i + slides.length) % slides.length);

  // เลื่อนแถบชื่อหมวด (แนวนอนเท่านั้น) ให้หมวดที่เปิดอยู่อยู่กลางแถบ
  useEffect(() => {
    const list = tabs.current;
    const tab = list?.children[active] as HTMLElement | undefined;
    if (!list || !tab || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="แนะนำหมวดงาน"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative bg-[#0b1220]"
    >
      {/* แถบเลือกหมวด */}
      <div className="border-b border-white/10 text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6">
          <p className="hidden flex-none py-4 pr-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45 xl:block">Spotlight</p>
          <div ref={tabs} role="tablist" aria-label="หมวดงาน" className="relative flex min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] lg:grid lg:grid-cols-7 lg:overflow-visible">
            {slides.map((s, i) => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={i === active}
                onClick={() => go(i)}
                className={`group relative flex-none whitespace-nowrap px-3 py-3.5 text-left text-xs font-semibold leading-tight transition-colors lg:whitespace-normal lg:py-4 lg:text-[13px] ${i === active ? "text-white" : "text-white/50 hover:text-white/85"}`}
              >
                <span className="mr-1.5 tabular-nums text-white/35">{String(i + 1).padStart(2, "0")}</span>
                {s.label}
                <span className="absolute inset-x-3 bottom-0 h-0.5 overflow-hidden bg-white/10">
                  {i === active && (
                    <span
                      key={active}
                      onAnimationEnd={() => go(active + 1)}
                      className={`${styles.progress} block h-full`}
                      style={{ background: s.accent, animationPlayState: paused ? "paused" : "running" }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
          <span className="flex flex-none gap-1">
            <button type="button" aria-label="หมวดก่อนหน้า" onClick={() => go(active - 1)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 ring-1 ring-white/15 hover:bg-white/10 hover:text-white sm:h-9 sm:w-9">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" aria-label="หมวดถัดไป" onClick={() => go(active + 1)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 ring-1 ring-white/15 hover:bg-white/10 hover:text-white sm:h-9 sm:w-9">
              <ChevronRight className="h-4 w-4" />
            </button>
          </span>
        </div>
      </div>

      <div
        className="grid grid-cols-[minmax(0,1fr)] overflow-hidden"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) go(active + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
      >
        {slides.map((s, i) => (
          <div
            key={s.key}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} จาก ${slides.length}: ${s.label}`}
            aria-hidden={i !== active}
            inert={i !== active}
            className={`${styles.slide} min-w-0 [grid-area:1/1] ${i === active ? styles.slideOn : ""}`}
          >
            {s.node}
          </div>
        ))}
      </div>
    </section>
  );
}
