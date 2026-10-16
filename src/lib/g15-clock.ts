// นาฬิกาเกมสด G15 — คำนวณเวลาในเกมจากเวลาที่แอดมินกดเริ่มแต่ละครึ่ง (เก็บในฐานข้อมูล)
// ไม่ได้เก็บ "นาทีปัจจุบัน" ไว้ที่ไหน ทุกเครื่องคำนวณเองจากเวลาเริ่ม → เห็นเวลาตรงกัน แม้แอดมินปิดหน้าจอไปแล้ว
// ใช้ได้ทั้งฝั่งเซิร์ฟเวอร์และเบราว์เซอร์ (ไม่มี dependency)

// PENALTIES = ดวลจุดโทษ (รอบน็อกเอาต์ที่เสมอเมื่อจบเวลาปกติ) — จบการดวลแล้วกลับเป็น FULL_TIME
export type ClockPhase = "PRE" | "FIRST_HALF" | "HALF_TIME" | "SECOND_HALF" | "PENALTIES" | "FULL_TIME";

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
  PENALTIES: { th: "ดวลจุดโทษ", en: "Penalties" },
  FULL_TIME: { th: "จบเกม", en: "Full-time" },
};

export function asPhase(p: string): ClockPhase {
  return (["PRE", "FIRST_HALF", "HALF_TIME", "SECOND_HALF", "PENALTIES", "FULL_TIME"] as const).includes(p as ClockPhase)
    ? (p as ClockPhase)
    : "PRE";
}

export function isClockRunning(phase: string) {
  return phase === "FIRST_HALF" || phase === "SECOND_HALF";
}

export function isClockLive(phase: string) {
  return phase === "FIRST_HALF" || phase === "HALF_TIME" || phase === "SECOND_HALF" || phase === "PENALTIES";
}

// ส่วนต่างนาฬิกาเครื่องผู้ใช้กับเซิร์ฟเวอร์ (serverNow - Date.now() ตอนโหลดหน้า)
// ค่าที่วัดได้รวมเวลาโหลดหน้าเข้าไปด้วย (มักไม่กี่วินาที) — ถ้าต่างไม่ถึง 10 วินาทีถือว่านาฬิกาเครื่องตรง ใช้เวลาเครื่องเลย
// ปรับเฉพาะเครื่องที่ตั้งนาฬิกาผิดจริง ๆ — ไม่งั้นนาฬิกาเกมจะช้ากว่าจริงเท่ากับเวลาโหลดหน้า
export function clockSkew(serverNow: number, clientNow: number) {
  const d = serverNow - clientNow;
  return Math.abs(d) < 10_000 ? 0 : d;
}

const pad = (n: number) => String(n).padStart(2, "0");
const ms = (d: Date | string | null) => (d == null ? null : new Date(d).getTime());

export type ClockReading = {
  phase: ClockPhase;
  // เวลาหลัก เช่น "23:41" / "45:00" / "HT" / "FT"
  main: string;
  // เวลาทดที่กำลังเดิน เช่น "+2:13" (เฉพาะตอนเกินเวลาปกติของครึ่งนั้น)
  stoppage: string | null;
  // นาทีตามแบบฟุตบอล (นาทีที่ 1 = 0:00-0:59 → 1) — ใช้เติมช่องนาทีของประตู/ใบเหลือง ฯลฯ; ช่วงทดเวลา minute = 45/90
  minute: number | null;
  // นาทีทดเวลา (ช่วงเกิน 45/90) เช่น 90+3 → minute 90, added 3
  added: number | null;
  // ทดเวลาที่ประกาศของครึ่งปัจจุบัน (ป้าย +3)
  announcedAdded: number | null;
};

export function readClock(state: ClockState, nowMs: number): ClockReading {
  const phase = asPhase(state.clockPhase);
  if (phase === "PRE") return { phase, main: "00:00", stoppage: null, minute: null, added: null, announcedAdded: null };
  if (phase === "HALF_TIME") return { phase, main: "HT", stoppage: null, minute: null, added: null, announcedAdded: state.firstHalfAddedTime };
  if (phase === "FULL_TIME") return { phase, main: "FT", stoppage: null, minute: null, added: null, announcedAdded: state.secondHalfAddedTime };
  if (phase === "PENALTIES") return { phase, main: "PEN", stoppage: null, minute: null, added: null, announcedAdded: null };

  const first = phase === "FIRST_HALF";
  const start = ms(first ? state.firstHalfStartedAt : state.secondHalfStartedAt);
  if (start == null) return { phase, main: first ? "00:00" : "45:00", stoppage: null, minute: null, added: null, announcedAdded: null };

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
      added: null,
      announcedAdded,
    };
  }
  const over = elapsedSec - regularSec;
  return {
    phase,
    main: `${base + HALF_MINUTES}:00`,
    stoppage: `+${Math.floor(over / 60)}:${pad(over % 60)}`,
    minute: base + HALF_MINUTES,
    added: Math.floor(over / 60) + 1,
    announcedAdded,
  };
}

// ===== นาทีของเหตุการณ์ (ประตู/ใบ/เปลี่ยนตัว) — รองรับทดเวลาแบบ 45+2 / 90+3 =====

// แสดงผล: 90 + 3 → "90+3'" · ข้อมูลเก่าที่เก็บเป็น 93 (ไม่มี addedMinute) ก็แสดงเป็น "90+3'" เหมือนกัน
export function formatMinute(minute: number | null | undefined, added?: number | null) {
  if (minute == null) return "";
  if (added) return `${minute}+${added}'`;
  if (minute > 90) return `90+${minute - 90}'`;
  return `${minute}'`;
}

// ลำดับเวลาจริงในเกม (45+2 มาก่อน 46, 90+3 มาหลัง 90) — ไม่มีนาทีไว้ท้ายสุด
export function minuteOrder(minute: number | null | undefined, added?: number | null) {
  if (minute == null) return 1_000_000;
  if (added) return minute * 100 + added;
  if (minute > 90) return 9000 + (minute - 90);
  return minute * 100;
}

// อ่านค่าที่พิมพ์: "23" · "45+2" · "90+3" · "93" (เกิน 90 → 90+3 อัตโนมัติ)
export function parseMinute(raw: string | null | undefined): { minute: number | null; addedMinute: number | null } {
  const s = String(raw ?? "").replace(/\s|'/g, "");
  if (!s) return { minute: null, addedMinute: null };
  const m = s.match(/^(\d{1,3})(?:\+(\d{1,2}))?$/);
  if (!m) return { minute: null, addedMinute: null };
  const minute = Number(m[1]);
  const added = m[2] != null ? Number(m[2]) : null;
  if (added) return { minute, addedMinute: added };
  if (minute > 90) return { minute: 90, addedMinute: minute - 90 };
  return { minute, addedMinute: null };
}

// ค่าเริ่มต้นในช่องนาที (ตอนแก้ไขเหตุการณ์เดิม)
export function minuteInputValue(minute: number | null | undefined, added?: number | null) {
  return formatMinute(minute, added).replace("'", "");
}
