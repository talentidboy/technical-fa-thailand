"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { renewedExpiry, thaiDate } from "@/lib/license-renewal";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

async function attempt(fn: () => Promise<string | void>): Promise<ActionResult> {
  try {
    const message = await fn();
    return { ok: true, ...(message ? { message } : {}) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ" };
  }
}

function revalidateRenewals(coachIds: number[]) {
  revalidatePath("/renewals");
  revalidatePath("/me");
  revalidatePath("/dashboard");
  for (const id of new Set(coachIds)) revalidatePath(`/coaches/${id}`);
}

// ต่ออายุทีละหลายใบ — เลือกจากรายการใบอนุญาต (recordIds) หรืออนุมัติคำขอของโค้ช (requestIds)
// ใบที่มีคำขอค้างอยู่ จะอนุมัติคำขอนั้นแทนการสร้างรายการใหม่
export async function renewLicenses(input: {
  recordIds: number[];
  requestIds: number[];
  date: string;
  years: number;
  note: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  return attempt(async () => {
    const renewDate = thaiDate(input.date);
    if (!renewDate) throw new Error("กรุณาระบุวันที่ต่ออายุ");
    if (renewDate.getTime() > Date.now() + 86_400_000) throw new Error("วันที่ต่ออายุต้องไม่เกินวันนี้");
    const years = Math.trunc(input.years);
    if (!(years >= 1 && years <= 5)) throw new Error("อายุใบอนุญาตต้องอยู่ระหว่าง 1–5 ปี");
    const note = input.note.trim().slice(0, 500) || null;

    const requests = input.requestIds.length
      ? await prisma.licenseRenewal.findMany({ where: { id: { in: input.requestIds }, status: "PENDING" }, select: { licenseRecordId: true } })
      : [];
    const ids = [...new Set([...input.recordIds, ...requests.map((r) => r.licenseRecordId)])];
    if (ids.length === 0) throw new Error("ยังไม่ได้เลือกใบอนุญาต (หรือคำขอถูกจัดการไปแล้ว)");
    if (ids.length > 500) throw new Error("เลือกได้ครั้งละไม่เกิน 500 ใบ");

    const [records, pending] = await Promise.all([
      prisma.licenseRecord.findMany({ where: { id: { in: ids } }, select: { id: true, coachId: true, expireDate: true } }),
      prisma.licenseRenewal.findMany({ where: { licenseRecordId: { in: ids }, status: "PENDING" }, select: { id: true, licenseRecordId: true } }),
    ]);
    const pendingByRecord = new Map(pending.map((p) => [p.licenseRecordId, p.id]));
    const now = new Date();

    await prisma.$transaction(
      records.flatMap((r) => {
        const next = renewedExpiry(r.expireDate, renewDate, years);
        const reviewed = { status: "APPROVED", reviewedAt: now, reviewedBy: admin.email, previousExpireDate: r.expireDate, newExpireDate: next };
        const requestId = pendingByRecord.get(r.id);
        return [
          prisma.licenseRecord.update({ where: { id: r.id }, data: { expireDate: next } }),
          requestId
            ? prisma.licenseRenewal.update({ where: { id: requestId }, data: { ...reviewed, reviewNote: note } })
            : prisma.licenseRenewal.create({ data: { ...reviewed, licenseRecordId: r.id, note, requestedAt: now } }),
        ];
      }),
    );
    revalidateRenewals(records.map((r) => r.coachId));
    return `ต่ออายุแล้ว ${records.length} ใบ`;
  });
}

// ไม่อนุมัติคำขอของโค้ช (ต้องระบุเหตุผล — โค้ชจะเห็นในหน้าของตัวเองแล้วยื่นใหม่ได้)
export async function rejectRenewal(requestId: number, reason: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  return attempt(async () => {
    const why = reason.trim().slice(0, 500);
    if (!why) throw new Error("กรุณาระบุเหตุผลที่ไม่อนุมัติ");
    const req = await prisma.licenseRenewal.findFirst({
      where: { id: requestId, status: "PENDING" },
      select: { id: true, licenseRecord: { select: { coachId: true } } },
    });
    if (!req) throw new Error("คำขอนี้ถูกจัดการไปแล้ว");
    await prisma.licenseRenewal.update({
      where: { id: req.id },
      data: { status: "REJECTED", reviewedAt: new Date(), reviewedBy: admin.email, reviewNote: why },
    });
    revalidateRenewals([req.licenseRecord.coachId]);
    return "บันทึกว่าไม่อนุมัติแล้ว";
  });
}

// ยกเลิกการต่ออายุ: คืนวันหมดอายุเดิม — ทำได้เฉพาะการต่ออายุครั้งล่าสุดของใบนั้น
// (คำขอของโค้ชจะกลับไปเป็น "รอตรวจสอบ", ที่แอดมินต่อให้เองจะถูกลบ)
export async function undoRenewal(renewalId: number): Promise<ActionResult> {
  await requireAdmin();
  return attempt(async () => {
    const r = await prisma.licenseRenewal.findFirst({
      where: { id: renewalId, status: "APPROVED" },
      include: { licenseRecord: { select: { id: true, coachId: true, expireDate: true } } },
    });
    if (!r) throw new Error("ไม่พบรายการต่ออายุนี้");
    if (r.licenseRecord.expireDate?.getTime() !== r.newExpireDate?.getTime()) {
      throw new Error("ใบอนุญาตนี้ถูกต่ออายุหรือแก้ไขวันหมดอายุภายหลังแล้ว — ยกเลิกรายการล่าสุดก่อน");
    }
    await prisma.$transaction([
      prisma.licenseRecord.update({ where: { id: r.licenseRecord.id }, data: { expireDate: r.previousExpireDate } }),
      r.requestedByCoach
        ? prisma.licenseRenewal.update({
            where: { id: r.id },
            data: { status: "PENDING", reviewedAt: null, reviewedBy: null, reviewNote: null, previousExpireDate: null, newExpireDate: null },
          })
        : prisma.licenseRenewal.delete({ where: { id: r.id } }),
    ]);
    revalidateRenewals([r.licenseRecord.coachId]);
    return "ยกเลิกการต่ออายุแล้ว — คืนวันหมดอายุเดิม";
  });
}
