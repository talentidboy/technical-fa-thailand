"use client";

import { useEffect, useState } from "react";
import { readClock, isClockRunning, PHASE_LABEL, type ClockState } from "@/lib/g15-clock";

// นาฬิกาเกมสด — เดินทุกวินาทีจากเวลาเริ่มครึ่งที่เก็บในฐานข้อมูล
// serverNow = เวลาฝั่งเซิร์ฟเวอร์ตอน render: ใช้ชดเชยนาฬิกาเครื่องผู้ชมที่เพี้ยน และให้ HTML รอบแรกตรงกันทั้งสองฝั่ง
export function LiveClock({
  state,
  serverNow,
  variant = "pill",
}: {
  state: ClockState;
  serverNow: number;
  variant?: "pill" | "big";
}) {
  // ส่วนต่างนาฬิกาเครื่อง vs เซิร์ฟเวอร์ — วัดครั้งแรกตอน effect ทำงาน (ไม่ใช้ Date.now ตอน render)
  const [now, setNow] = useState(serverNow);
  const running = isClockRunning(state.clockPhase);

  useEffect(() => {
    if (!running) return;
    const skew = serverNow - Date.now();
    const id = setInterval(() => setNow(Date.now() + skew), 1000);
    return () => clearInterval(id);
  }, [running, serverNow]);

  const r = readClock(state, running ? now : serverNow);
  const label = PHASE_LABEL[r.phase];

  if (variant === "big") {
    return (
      <div className="flex flex-col items-center">
        <span className="text-[11px] font-bold uppercase tracking-widest text-g15-300">
          {label.th} / {label.en}
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-mono text-5xl font-black tabular-nums text-white sm:text-6xl">{r.main}</span>
          {r.stoppage && <span className="font-mono text-2xl font-bold tabular-nums text-amber-300">{r.stoppage}</span>}
        </div>
        {r.announcedAdded != null && r.announcedAdded > 0 && (
          <span className="mt-2 rounded-md bg-emerald-500 px-2.5 py-1 font-mono text-sm font-black text-white shadow">
            +{r.announcedAdded}
          </span>
        )}
      </div>
    );
  }

  if (r.phase === "PRE") return null;
  const live = running;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-sm font-black tabular-nums ${
        live ? "bg-red-600 text-white" : r.phase === "HALF_TIME" ? "bg-amber-400 text-amber-950" : "bg-slate-900 text-white"
      }`}
      aria-label={`${label.th} ${r.main}`}
    >
      {live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
      {r.main}
      {r.stoppage && <span className="text-amber-200">{r.stoppage}</span>}
      {r.announcedAdded != null && r.announcedAdded > 0 && live && (
        <span className="rounded bg-emerald-500 px-1 text-[10px] text-white">+{r.announcedAdded}</span>
      )}
    </span>
  );
}
