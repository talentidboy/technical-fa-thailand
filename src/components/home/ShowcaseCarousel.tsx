"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./showcase.module.css";

export type Slide = { key: string; label: string; accent: string; node: React.ReactNode };

// สไลด์แนะนำหมวดงาน: เปลี่ยนเองทุก 7 วินาที (แถบความคืบหน้าใต้ชื่อหมวด = ตัวจับเวลา — เมื่อแถบวิ่งเต็มจึงเลื่อนไปหมวดถัดไป)
// ชี้เมาส์/โฟกัสอยู่ในสไลด์ = หยุดชั่วคราว · ปัดซ้ายขวาบนมือถือ · ผู้ใช้ที่ตั้งค่าลดการเคลื่อนไหวจะไม่เลื่อนเอง (แถบไม่วิ่ง)
// ทุกสไลด์ซ้อนกันในช่องเดียว → ความสูงคงที่เท่าสไลด์ที่สูงที่สุด เนื้อหาด้านล่างไม่กระโดดตอนเปลี่ยนสไลด์
export function ShowcaseCarousel({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const go = (i: number) => setActive((i + slides.length) % slides.length);
  const current = slides[active];

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
          <div role="tablist" aria-label="หมวดงาน" className="hidden flex-1 grid-cols-7 lg:grid">
            {slides.map((s, i) => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={i === active}
                onClick={() => go(i)}
                className={`group relative px-3 py-4 text-left text-[13px] font-semibold leading-tight transition-colors ${i === active ? "text-white" : "text-white/50 hover:text-white/85"}`}
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
          {/* มือถือ/แท็บเล็ต: ชื่อหมวดปัจจุบัน + จุด */}
          <div className="flex flex-1 items-center gap-3 py-3 lg:hidden">
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              <span className="mr-1.5 tabular-nums text-white/40">{String(active + 1).padStart(2, "0")}</span>
              {current.label}
            </span>
            <span className="flex flex-none items-center gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  aria-label={s.label}
                  aria-current={i === active}
                  onClick={() => go(i)}
                  className="relative h-1.5 overflow-hidden rounded-full bg-white/20 transition-[width]"
                  style={{ width: i === active ? "1.75rem" : "0.375rem" }}
                >
                  {i === active && (
                    <span
                      key={active}
                      onAnimationEnd={() => go(active + 1)}
                      className={`${styles.progress} absolute inset-y-0 left-0 block`}
                      style={{ background: s.accent, animationPlayState: paused ? "paused" : "running" }}
                    />
                  )}
                </button>
              ))}
            </span>
          </div>
          <span className="flex flex-none gap-1">
            <button type="button" aria-label="หมวดก่อนหน้า" onClick={() => go(active - 1)} className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 ring-1 ring-white/15 hover:bg-white/10 hover:text-white">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" aria-label="หมวดถัดไป" onClick={() => go(active + 1)} className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 ring-1 ring-white/15 hover:bg-white/10 hover:text-white">
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
