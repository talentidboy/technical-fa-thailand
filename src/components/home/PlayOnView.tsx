"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./showcase.module.css";

// หยุดอนิเมชันข้างในไว้ก่อน แล้วเริ่มเล่นเมื่อเลื่อนมาถึง (เช่น ภาพวาดแทคติกบนไวท์บอร์ดที่อยู่กลางหน้า)
export function PlayOnView({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${className} ${on ? "" : styles.hold}`}>
      {children}
    </div>
  );
}
