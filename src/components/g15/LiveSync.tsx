"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// ซิงก์ข้อมูลเกมสดแบบเบา: ถามเวอร์ชันข้อมูล (/api/g15/version) ทุก intervalMs แล้ว router.refresh() เฉพาะตอนเวอร์ชันเปลี่ยน
// คนดูเห็นสกอร์/เหตุการณ์ใหม่ภายใน ~3 วินาที โดยไม่ต้องโหลดทั้งหน้าซ้ำทุกรอบ; แท็บที่ซ่อนอยู่จะไม่ถาม แต่กลับมาเปิดแล้วเช็กทันที
export function LiveSync({
  active,
  matchId,
  stage,
  intervalMs = 3000,
}: {
  active: boolean;
  matchId?: number;
  stage?: "NATIONAL" | "REGIONAL";
  intervalMs?: number;
}) {
  const router = useRouter();
  const last = useRef<string | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    if (!active) return;
    const qs = matchId != null ? `match=${matchId}` : `stage=${stage ?? "NATIONAL"}`;

    const check = async () => {
      if (busy.current || document.visibilityState !== "visible") return;
      busy.current = true;
      try {
        const res = await fetch(`/api/g15/version?${qs}`, { cache: "no-store" });
        if (res.ok) {
          const { v } = (await res.json()) as { v: string };
          // ครั้งแรกแค่จำค่าไว้ (หน้าที่เพิ่งโหลดมาเป็นข้อมูลล่าสุดอยู่แล้ว)
          if (last.current != null && v !== last.current) router.refresh();
          last.current = v;
        }
      } catch {
        // เน็ตหลุดชั่วคราว — รอบถัดไปลองใหม่เอง
      } finally {
        busy.current = false;
      }
    };

    check();
    const id = setInterval(check, intervalMs);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, matchId, stage, intervalMs, router]);

  return null;
}
