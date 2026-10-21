import { prisma } from "./prisma";
import { currentLicenseRecords, daysUntil, licenseTrack, RENEWAL_WINDOW_DAYS } from "./license-renewal";

export type RenewalGroup = "expiring" | "recent" | "old";

// กลุ่มของใบอนุญาตปัจจุบันตามวันหมดอายุ: ใกล้หมด (ภายใน 6 เดือน) · หมดอายุภายใน 1 ปี · หมดอายุนานกว่า 1 ปี
export function renewalGroup(expireDate: Date, now = new Date()): RenewalGroup | null {
  const days = daysUntil(expireDate, now);
  if (days > RENEWAL_WINDOW_DAYS) return null;
  if (days >= 0) return "expiring";
  return days >= -365 ? "recent" : "old";
}

// ใบอนุญาต "ปัจจุบัน" (ระดับสูงสุดของแต่ละสาย) ของโค้ชทุกคนที่มีวันหมดอายุ
export async function loadCurrentLicenses() {
  const records = await prisma.licenseRecord.findMany({
    select: { id: true, coachId: true, licenseType: true, issueDate: true, expireDate: true, certificateNo: true },
  });
  return currentLicenseRecords(records).filter((r): r is typeof r & { expireDate: Date } => r.expireDate != null);
}

export function matchesLevel(licenseType: string, level: string | undefined) {
  if (!level) return true;
  return level === "GK" ? licenseTrack(licenseType) === "GK" : licenseType === level;
}

// ค้นหาโค้ชจากชื่อไทย/อังกฤษ, AFC ID, เลขบัตร — ทุกคำที่พิมพ์ต้องเจอในช่องใดช่องหนึ่ง
export async function searchCoachIds(q: string) {
  const tokens = q.trim().split(/\s+/).filter(Boolean).slice(0, 4);
  if (tokens.length === 0) return null;
  const rows = await prisma.coach.findMany({
    where: {
      AND: tokens.map((t) => ({
        OR: [
          { nameTh: { contains: t } },
          { surnameTh: { contains: t } },
          { nameEn: { contains: t, mode: "insensitive" as const } },
          { familyNameEn: { contains: t, mode: "insensitive" as const } },
          { afcId: { contains: t, mode: "insensitive" as const } },
          { idNumber: { contains: t.replace(/\D/g, "") || t } },
        ],
      })),
    },
    select: { id: true },
    take: 3000,
  });
  return new Set(rows.map((r) => r.id));
}
