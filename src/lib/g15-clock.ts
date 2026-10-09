// นาฬิกาเกมสด G15 — คำนวณเวลาในเกมจากเวลาที่แอดมินกดเริ่มแต่ละครึ่ง (เก็บในฐานข้อมูล)
// ไม่ได้เก็บ "นาทีปัจจุบัน" ไว้ที่ไหน ทุกเครื่องคำนวณเองจากเวลาเริ่ม → เห็นเวลาตรงกัน แม้แอดมินปิดหน้าจอไปแล้ว
// ใช้ได้ทั้งฝั่งเซิร์ฟเวอร์และเบราว์เซอร์ (ไม่มี dependency)

export type ClockPhase = "PRE" | "FIRST_HALF" | "HALF_TIME" | "SECOND_HALF" | "FULL_TIME";

export const HALF_MINUTES = 45;

export type ClockState = {
  clockPhase: string;
  firstHalfStartedAt: Date | string | null;
  secondHalfStartedAt: Date | string | null;
  firstHalfAddedTime: number | null;
  secondHalfAddedTime: number | null;
};

export const PHASE_LABEL: Record<ClockPhase, { th: string; en: string }> = {
  PRE: { th: "ยังไม่เริ่ม", en: "Pre-match" },
  FIRST_HALF: { th: "ครึ่งแรก", en: "1st Half" },
  HALF_TIME: { th: "พักครึ่ง", en: "Half-time" },
  SECOND_HALF: { th: "ครึ่งหลัง", en: "2nd Half" },
  FULL_TIME: { th: "จบเกม", en: "Full-time" },
};

export function asPhase(p: string): ClockPhase {
  return (["PRE", "FIRST_HALF", "HALF_TIME", "SECOND_HALF", "FULL_TIME"] as const).includes(p as ClockPhase)
    ? (p as ClockPhase)
    : "PRE";
}

export function isClockRunning(phase: string) {
  return phase === "FIRST_HALF" || phase === "SECOND_HALF";
}

export function isClockLive(phase: string) {
  return phase === "FIRST_HALF" || phase === "HALF_TIME" || phase === "SECOND_HALF";
}

const pad = (n: number) => String(n).padStart(2, "0");
const ms = (d: Date | string | null) => (d == null ? null : new Date(d).getTime());

export type ClockReading = {
  phase: ClockPhase;
  // เวลาหลัก เช่น "23:41" / "45:00" / "HT" / "FT"
  main: string;
  // เวลาทดที่กำลังเดิน เช่น "+2:13" (เฉพาะตอนเกินเวลาปกติของครึ่งนั้น)
  stoppage: string | null;
  // นาทีตามแบบฟุตบอล (นาทีที่ 1 = 0:00-0:59 → 1) — ใช้เติมช่องนาทีของประตู/ใบเหลือง ฯลฯ; ทดเวลา 45+2 = 47
  minute: number | null;
  // ทดเวลาที่ประกาศของครึ่งปัจจุบัน (ป้าย +3)
  announcedAdded: number | null;
};

export function readClock(state: ClockState, nowMs: number): ClockReading {
  const phase = asPhase(state.clockPhase);
  if (phase === "PRE") return { phase, main: "00:00", stoppage: null, minute: null, announcedAdded: null };
  if (phase === "HALF_TIME") return { phase, main: "HT", stoppage: null, minute: null, announcedAdded: state.firstHalfAddedTime };
  if (phase === "FULL_TIME") return { phase, main: "FT", stoppage: null, minute: null, announcedAdded: state.secondHalfAddedTime };

  const first = phase === "FIRST_HALF";
  const start = ms(first ? state.firstHalfStartedAt : state.secondHalfStartedAt);
  if (start == null) return { phase, main: first ? "00:00" : "45:00", stoppage: null, minute: null, announcedAdded: null };

  const base = first ? 0 : HALF_MINUTES;
  const elapsedSec = Math.max(0, Math.floor((nowMs - start) / 1000));
  const regularSec = HALF_MINUTES * 60;
  const announcedAdded = first ? state.firstHalfAddedTime : state.secondHalfAddedTime;

  if (elapsedSec < regularSec) {
    const total = base * 60 + elapsedSec;
    return {
      phase,
      main: `${pad(Math.floor(total / 60))}:${pad(total % 60)}`,
      stoppage: null,
      minute: Math.floor(total / 60) + 1,
      announcedAdded,
    };
  }
  const over = elapsedSec - regularSec;
  return {
    phase,
    main: `${base + HALF_MINUTES}:00`,
    stoppage: `+${Math.floor(over / 60)}:${pad(over % 60)}`,
    minute: base + HALF_MINUTES + Math.floor(over / 60) + 1,
    announcedAdded,
  };
}
