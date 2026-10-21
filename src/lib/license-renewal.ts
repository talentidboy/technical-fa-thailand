// ต่ออายุใบอนุญาต — กติกากลางที่ใช้ทั้งหน้าแอดมิน หน้าโค้ช และ server action
// ไฟล์นี้ไม่แตะฐานข้อมูล ใช้ได้ทั้งฝั่ง server และ client

import { CORE_LICENSE_PROGRESSION } from "./constants";

// อายุใบอนุญาตหลังต่ออายุ (ปี) — ค่าเริ่มต้นตามอายุใบอนุญาตเดิมในระบบ
export const RENEWAL_YEARS = 3;
// ยื่นคำขอต่ออายุได้เมื่อเหลืออายุไม่เกินกี่วัน (หรือหมดอายุแล้ว)
export const RENEWAL_WINDOW_DAYS = 180;

export const RENEWAL_STATUS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "รอตรวจสอบ", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  APPROVED: { label: "ต่ออายุแล้ว", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  REJECTED: { label: "ไม่อนุมัติ", className: "bg-red-50 text-red-700 ring-red-200" },
};

const GK_TRACK = ["GK_I", "GK_II", "GK"];

// สายใบอนุญาต: ระดับหลัก G → C → B → A → PRO เป็นสายเดียว (ได้ระดับสูงกว่า = ใบล่างไม่ต้องต่ออายุ),
// ผู้รักษาประตู (GK) เป็นอีกสาย, ระดับอื่นแยกสายของตัวเอง
export function licenseTrack(licenseType: string) {
  if (CORE_LICENSE_PROGRESSION.includes(licenseType)) return "CORE";
  if (GK_TRACK.includes(licenseType)) return "GK";
  return licenseType;
}

function trackLevel(licenseType: string) {
  const core = CORE_LICENSE_PROGRESSION.indexOf(licenseType);
  if (core >= 0) return core;
  const gk = GK_TRACK.indexOf(licenseType);
  return gk >= 0 ? gk : 0;
}

type RecordLike = { id: number; coachId: number; licenseType: string; issueDate: Date | null };

// ใบอนุญาต "ปัจจุบัน" ของโค้ชแต่ละคน: ระดับสูงสุดของแต่ละสาย (ระดับเท่ากัน = ใบที่ออกล่าสุด)
// ใบที่ถูกแทนด้วยระดับสูงกว่าแล้วไม่นับ เช่น มี B (หมดอายุ 2015) กับ A → ใบที่ต้องดูวันหมดอายุคือ A
export function currentLicenseRecords<T extends RecordLike>(records: T[]): T[] {
  const best = new Map<string, T>();
  for (const r of records) {
    const key = `${r.coachId}|${licenseTrack(r.licenseType)}`;
    const cur = best.get(key);
    if (!cur) {
      best.set(key, r);
      continue;
    }
    const d = trackLevel(r.licenseType) - trackLevel(cur.licenseType);
    const newer = (r.issueDate?.getTime() ?? 0) - (cur.issueDate?.getTime() ?? 0) || r.id - cur.id;
    if (d > 0 || (d === 0 && newer > 0)) best.set(key, r);
  }
  return [...best.values()];
}

// วันหมดอายุใหม่: ยังไม่หมดอายุ = ต่อจากวันหมดอายุเดิม (ไม่เสียวันที่เหลือ) · หมดอายุแล้ว/ไม่มีวัน = นับจากวันที่ต่ออายุ
export function renewedExpiry(currentExpire: Date | null, renewDate: Date, years = RENEWAL_YEARS) {
  const base = currentExpire && currentExpire.getTime() > renewDate.getTime() ? currentExpire : renewDate;
  const d = new Date(base);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d;
}

// "YYYY-MM-DD" (วันที่ไทย) → เวลาเที่ยงคืนของวันนั้นตามเวลาไทย
export function thaiDate(input: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  const d = new Date(`${input}T00:00:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// วันนี้ตามเวลาไทยในรูป "YYYY-MM-DD"
export function todayThai(now = new Date()) {
  return new Date(now.getTime() + 7 * 3600_000).toISOString().slice(0, 10);
}

export function daysUntil(date: Date, now = new Date()) {
  return Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
}

// ยื่นคำขอต่ออายุได้ไหม (เหลือไม่เกิน RENEWAL_WINDOW_DAYS วัน หรือหมดอายุแล้ว)
export function canRequestRenewal(expireDate: Date | null, now = new Date()) {
  return !!expireDate && daysUntil(expireDate, now) <= RENEWAL_WINDOW_DAYS;
}

export function formatThaiDate(date: Date | null | undefined) {
  if (!date) return "-";
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });
}
