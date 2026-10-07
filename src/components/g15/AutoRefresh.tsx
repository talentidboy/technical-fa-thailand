"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// โหลดข้อมูลหน้าใหม่ทุก ๆ intervalMs ระหว่างมีนัดกำลังแข่ง ให้คนดูเห็นสกอร์สดโดยไม่ต้องกดรีเฟรชเอง
// active = false (ไม่มีนัดกำลังแข่ง) จะไม่ยิงอะไรเลย กันโหลดเซิร์ฟเวอร์เปล่า ๆ
export function AutoRefresh({ active, intervalMs = 60_000 }: { active: boolean; intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs, router]);
  return null;
}
