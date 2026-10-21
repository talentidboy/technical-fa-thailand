"use server";

import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { saveUploadedPhoto } from "@/lib/upload";
import { canRequestRenewal, currentLicenseRecords } from "@/lib/license-renewal";

export type RenewalRequestState = { ok: true; message: string } | { ok: false; error: string } | null;

// โค้ชยื่นคำขอต่ออายุใบอนุญาตของตัวเอง (ใบระดับสูงสุดของสายนั้น ที่ใกล้หมด/หมดอายุแล้ว) — แนบรูปหลักฐานได้
export async function requestRenewal(_prev: RenewalRequestState, formData: FormData): Promise<RenewalRequestState> {
  const user = await requireCoach();
  try {
    const recordId = Number(formData.get("recordId"));
    const note = String(formData.get("note") ?? "").trim();
    if (note.length < 5) throw new Error("กรุณาระบุกิจกรรม/การอบรมที่เข้าร่วม (อย่างน้อย 5 ตัวอักษร)");
    if (note.length > 1000) throw new Error("ข้อความยาวเกินไป (ไม่เกิน 1,000 ตัวอักษร)");

    const records = await prisma.licenseRecord.findMany({
      where: { coachId: user.coachId! },
      select: { id: true, coachId: true, licenseType: true, issueDate: true, expireDate: true },
    });
    const record = currentLicenseRecords(records).find((r) => r.id === recordId);
    if (!record) throw new Error("ใบอนุญาตนี้ไม่ต้องต่ออายุ (มีระดับที่สูงกว่าแล้ว)");
    if (!canRequestRenewal(record.expireDate)) throw new Error("ใบอนุญาตนี้ยังไม่ถึงช่วงต่ออายุ");
    const existing = await prisma.licenseRenewal.findFirst({ where: { licenseRecordId: record.id, status: "PENDING" } });
    if (existing) throw new Error("ส่งคำขอไปแล้ว — รอเจ้าหน้าที่ตรวจสอบ");

    const file = formData.get("evidence");
    const evidenceUrl = file instanceof File && file.size > 0 ? await saveUploadedPhoto(file) : null;

    await prisma.licenseRenewal.create({
      data: { licenseRecordId: record.id, status: "PENDING", requestedByCoach: true, note, evidenceUrl },
    });
    revalidatePath("/me");
    revalidatePath("/renewals");
    return { ok: true, message: "ส่งคำขอต่ออายุแล้ว — เจ้าหน้าที่จะตรวจสอบและแจ้งผลในหน้านี้" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "ส่งคำขอไม่สำเร็จ" };
  }
}

// ยกเลิกคำขอที่ยังรอตรวจสอบ
export async function cancelRenewalRequest(formData: FormData) {
  const user = await requireCoach();
  const id = Number(formData.get("id"));
  await prisma.licenseRenewal.deleteMany({
    where: { id, status: "PENDING", requestedByCoach: true, licenseRecord: { coachId: user.coachId! } },
  });
  revalidatePath("/me");
  revalidatePath("/renewals");
}
