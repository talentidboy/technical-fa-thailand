import { prisma } from "./prisma";
import { LICENSE_TYPES, labelFor } from "./constants";

// กฎ: ผู้ฝึกสอน 1 คนมีใบอนุญาตได้ 1 ใบต่อ 1 ระดับ — ต่ออายุ = เลื่อนวันหมดอายุของใบเดิม ไม่ใช่ออกใบใหม่
export const ONE_PER_LEVEL_HINT = "1 คนมีได้ 1 ใบต่อ 1 ระดับ — ถ้าต้องการขยายวันหมดอายุ ให้ใช้ “ต่ออายุ” แทน";

export async function assertNoSameLevel(coachId: number, licenseType: string) {
  const existing = await prisma.licenseRecord.findFirst({ where: { coachId, licenseType }, select: { certificateNo: true } });
  if (existing) {
    throw new Error(`ผู้ฝึกสอนคนนี้มีใบอนุญาตระดับ ${labelFor(LICENSE_TYPES, licenseType)} อยู่แล้ว${existing.certificateNo ? ` (เลขที่ ${existing.certificateNo})` : ""} — ${ONE_PER_LEVEL_HINT}`);
  }
}
