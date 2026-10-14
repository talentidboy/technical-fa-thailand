"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { CORE_LICENSE_PROGRESSION } from "@/lib/constants";
import { getHighestCoreLevel } from "@/lib/license-rank";
import { nthCertificateNo, LIVE_APPLICATION_STATUSES } from "@/lib/course-workflow";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

async function attempt(fn: () => Promise<string | void>): Promise<ActionResult> {
  try {
    const message = await fn();
    return { ok: true, ...(message ? { message } : {}) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ" };
  }
}

function revalidateSession(sessionId: number, coachIds: number[] = []) {
  revalidatePath(`/course-sessions/${sessionId}`);
  revalidatePath("/course-sessions");
  revalidatePath(`/apply/${sessionId}`);
  for (const id of coachIds) revalidatePath(`/coaches/${id}`);
}

// อนุมัติ / ไม่อนุมัติ / ย้อนกลับเป็นรออนุมัติ ทีละหลายคน (ยังไม่ออกใบอนุญาต — ออกตอนยืนยันผลการอบรม)
export async function reviewApplications(
  sessionId: number,
  ids: number[],
  decision: "APPROVED" | "REJECTED" | "PENDING",
): Promise<ActionResult> {
  const admin = await requireAdmin();
  return attempt(async () => {
    if (!["APPROVED", "REJECTED", "PENDING"].includes(decision)) throw new Error("คำสั่งไม่ถูกต้อง");
    const { count } = await prisma.application.updateMany({
      // คนที่ยืนยันผลไปแล้ว (PASSED/FAILED) เปลี่ยนจากตรงนี้ไม่ได้ ต้องยกเลิกผลก่อน
      where: { id: { in: ids }, courseSessionId: sessionId, status: { in: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] } },
      data:
        decision === "PENDING"
          ? { status: "PENDING", reviewedAt: null, reviewedBy: null }
          : { status: decision, reviewedAt: new Date(), reviewedBy: admin.email },
    });
    revalidateSession(sessionId);
    return `${decision === "APPROVED" ? "อนุมัติเข้าอบรม" : decision === "REJECTED" ? "ไม่อนุมัติ" : "ย้อนเป็นรออนุมัติ"} ${count} คน`;
  });
}

export type CoachSearchRow = {
  id: number;
  name: string;
  nameEn: string | null;
  idTail: string | null;
  level: string | null;
  certificateNo: string | null;
  inSession: boolean;
};

// ค้นหาผู้ฝึกสอนในระบบเพื่อเพิ่มเป็นผู้เข้าอบรมเอง (คนที่ไม่ได้สมัครออนไลน์ / walk-in)
export async function searchCoaches(sessionId: number, q: string): Promise<CoachSearchRow[]> {
  await requireAdmin();
  const text = q.trim();
  if (text.length < 2) return [];
  const digits = text.replace(/\D/g, "");
  const words = text.split(/\s+/).filter(Boolean);

  const coaches = await prisma.coach.findMany({
    where: {
      OR: [
        // ชื่อ + นามสกุล (พิมพ์ "สมชาย ใจ" ได้)
        {
          AND: words.map((w) => ({
            OR: [
              { nameTh: { contains: w, mode: "insensitive" as const } },
              { surnameTh: { contains: w, mode: "insensitive" as const } },
              { nameEn: { contains: w, mode: "insensitive" as const } },
              { familyNameEn: { contains: w, mode: "insensitive" as const } },
            ],
          })),
        },
        ...(digits.length >= 4 ? [{ idNumber: { contains: digits } }] : []),
        { afcId: { contains: text, mode: "insensitive" as const } },
        { licenseRecords: { some: { certificateNo: { contains: text, mode: "insensitive" as const } } } },
      ],
    },
    take: 12,
    orderBy: [{ nameTh: "asc" }],
    include: {
      licenseRecords: { select: { licenseType: true, certificateNo: true, issueDate: true }, orderBy: { issueDate: "desc" } },
      applications: { where: { courseSessionId: sessionId }, select: { status: true } },
    },
  });

  return coaches.map((c) => ({
    id: c.id,
    name: `${c.nameTh} ${c.surnameTh}`,
    nameEn: [c.nameEn, c.familyNameEn].filter(Boolean).join(" ") || null,
    idTail: c.idNumber ? c.idNumber.replace(/\D/g, "").slice(-4) : null,
    level: getHighestCoreLevel(c.licenseRecords),
    certificateNo: c.licenseRecords.find((r) => r.certificateNo)?.certificateNo ?? null,
    inSession: c.applications.some((a) => LIVE_APPLICATION_STATUSES.includes(a.status)),
  }));
}

// เพิ่มผู้เข้าอบรมเอง → อนุมัติเข้าอบรมทันที
export async function addParticipants(sessionId: number, coachIds: number[]): Promise<ActionResult> {
  const admin = await requireAdmin();
  return attempt(async () => {
    for (const coachId of coachIds) {
      await prisma.application.upsert({
        where: { coachId_courseSessionId: { coachId, courseSessionId: sessionId } },
        create: { coachId, courseSessionId: sessionId, status: "APPROVED", reviewedAt: new Date(), reviewedBy: admin.email, note: "เพิ่มโดยเจ้าหน้าที่" },
        update: { status: "APPROVED", reviewedAt: new Date(), reviewedBy: admin.email },
      });
    }
    revalidateSession(sessionId, coachIds);
    return `เพิ่มผู้เข้าอบรม ${coachIds.length} คน`;
  });
}

// ยืนยันผลการอบรมทั้งรุ่นในครั้งเดียว: คนที่ติ๊ก "ผ่าน" ได้ใบอนุญาตพร้อมเลขที่ใบประกาศเรียงต่อกัน, ที่เหลือ = ไม่ผ่าน
export async function confirmResults(input: {
  sessionId: number;
  passedIds: number[];
  failedIds: number[];
  issueDate: string;
  expireDate: string;
  instructorId: number | null;
  startNo: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  return attempt(async () => {
    const session = await prisma.courseSession.findUnique({
      where: { id: input.sessionId },
      include: {
        course: true,
        applications: {
          where: { id: { in: [...input.passedIds, ...input.failedIds] }, status: "APPROVED" },
          include: { coach: { include: { licenseRecords: { select: { licenseType: true } } } } },
        },
      },
    });
    if (!session) throw new Error("ไม่พบรุ่นอบรม");
    const byId = new Map(session.applications.map((a) => [a.id, a]));
    // เรียงตามลำดับที่หน้าจอส่งมา (= ลำดับเลขที่ใบประกาศที่แสดงให้ดู)
    const passed = input.passedIds.map((id) => byId.get(id)).filter((a) => a !== undefined);
    const failed = input.failedIds.map((id) => byId.get(id)).filter((a) => a !== undefined);
    if (passed.length + failed.length === 0) throw new Error("ไม่มีผู้เข้าอบรมที่รอยืนยันผล");

    const licenseType = session.course.licenseType;
    const issueDate = input.issueDate ? new Date(input.issueDate) : null;
    const expireDate = input.expireDate ? new Date(input.expireDate) : null;
    if (licenseType && passed.length > 0) {
      if (!issueDate || Number.isNaN(issueDate.getTime())) throw new Error("กรุณาระบุวันที่ออกใบ");
      if (expireDate && expireDate <= issueDate) throw new Error("วันหมดอายุต้องหลังวันที่ออกใบ");
      if (!input.startNo.trim()) throw new Error("กรุณาระบุเลขที่ใบประกาศเริ่มต้น");
    }

    const numbers = passed.map((_, i) => nthCertificateNo(input.startNo.trim(), i));
    if (licenseType && numbers.length > 0) {
      const taken = await prisma.licenseRecord.findMany({
        where: { certificateNo: { in: numbers } },
        select: { certificateNo: true },
      });
      if (taken.length > 0) {
        throw new Error(`เลขที่ใบประกาศซ้ำกับที่มีอยู่แล้ว: ${taken.map((t) => t.certificateNo).join(", ")} — กรุณาเปลี่ยนเลขเริ่มต้น`);
      }
    }

    const now = new Date();
    const levelIdx = licenseType ? CORE_LICENSE_PROGRESSION.indexOf(licenseType) : -1;
    await prisma.$transaction(async (tx) => {
      for (const [i, app] of passed.entries()) {
        let licenseRecordId: number | null = null;
        if (licenseType) {
          const prevIdx = CORE_LICENSE_PROGRESSION.indexOf(getHighestCoreLevel(app.coach.licenseRecords) ?? "");
          const record = await tx.licenseRecord.create({
            data: {
              coachId: app.coachId,
              licenseType,
              recordType: "TRAINING",
              isLevelUp: prevIdx >= 0 && prevIdx < levelIdx,
              certificateNo: numbers[i],
              issueDate,
              expireDate,
              confirmedBy: admin.email,
              instructorId: input.instructorId,
            },
          });
          licenseRecordId = record.id;
        }
        await tx.application.update({
          where: { id: app.id },
          data: { status: "PASSED", licenseRecordId, reviewedAt: now, reviewedBy: admin.email },
        });
      }
      if (failed.length > 0) {
        await tx.application.updateMany({
          where: { id: { in: failed.map((a) => a.id) } },
          data: { status: "FAILED", reviewedAt: now, reviewedBy: admin.email },
        });
      }
      // ไม่มีใครรอยืนยันผลแล้ว = จบรุ่น
      const remaining = await tx.application.count({ where: { courseSessionId: session.id, status: "APPROVED" } });
      if (remaining === 0) await tx.courseSession.update({ where: { id: session.id }, data: { status: "COMPLETED" } });
    });

    revalidateSession(session.id, [...passed, ...failed].map((a) => a.coachId));
    revalidatePath("/me");
    return licenseType
      ? `ยืนยันผลแล้ว — ออกใบอนุญาต ${passed.length} คน${failed.length ? ` · ไม่ผ่าน ${failed.length} คน` : ""}`
      : `ยืนยันผลแล้ว — ผ่าน ${passed.length} คน${failed.length ? ` · ไม่ผ่าน ${failed.length} คน` : ""}`;
  });
}

// ยกเลิกผล (กรณีกดผิด) → ลบใบอนุญาตที่ออกจากรุ่นนี้ แล้วกลับเป็น "อนุมัติเข้าอบรม" ให้ยืนยันผลใหม่ได้
export async function undoResult(sessionId: number, applicationId: number): Promise<ActionResult> {
  await requireAdmin();
  return attempt(async () => {
    const app = await prisma.application.findFirst({ where: { id: applicationId, courseSessionId: sessionId } });
    if (!app || !["PASSED", "FAILED"].includes(app.status)) throw new Error("ไม่พบผลการอบรมที่จะยกเลิก");
    await prisma.$transaction(async (tx) => {
      await tx.application.update({ where: { id: app.id }, data: { status: "APPROVED", licenseRecordId: null } });
      if (app.licenseRecordId) await tx.licenseRecord.delete({ where: { id: app.licenseRecordId } });
      await tx.courseSession.updateMany({ where: { id: sessionId, status: "COMPLETED" }, data: { status: "CLOSED" } });
    });
    revalidateSession(sessionId, [app.coachId]);
    revalidatePath("/me");
    return "ยกเลิกผลแล้ว — กลับไปรอยืนยันผล";
  });
}

// ผู้สมัครใหม่ที่ระบบไม่พบเลขบัตร แต่จริงๆ มีประวัติเดิมอยู่แล้ว (ประวัติเก่าไม่มีเลขบัตร) → รวมเป็นคนเดียวกัน
// ย้ายบัญชี + ใบสมัคร + ข้อมูลที่กรอกใหม่ ไปไว้ที่ประวัติเดิม (ใบอนุญาตเดิมยังอยู่ครบ) แล้วลบประวัติที่สร้างใหม่
export async function mergeIntoExistingCoach(
  sessionId: number,
  applicationId: number,
  targetCoachId: number,
): Promise<ActionResult> {
  await requireAdmin();
  return attempt(async () => {
    const app = await prisma.application.findFirst({
      where: { id: applicationId, courseSessionId: sessionId },
      include: { coach: { include: { systemUser: true, _count: { select: { licenseRecords: true, employments: true } } } } },
    });
    if (!app) throw new Error("ไม่พบใบสมัคร");
    const source = app.coach;
    const target = await prisma.coach.findUnique({ where: { id: targetCoachId }, include: { systemUser: true } });
    if (!target || target.id === source.id) throw new Error("ไม่พบประวัติเดิมที่จะรวม");
    if (source._count.licenseRecords > 0 || source._count.employments > 0) {
      throw new Error("ประวัติของผู้สมัครมีข้อมูลใบอนุญาต/การทำงานอยู่แล้ว รวมอัตโนมัติไม่ได้");
    }
    if (target.systemUser && source.systemUser) throw new Error("ประวัติเดิมมีบัญชีเข้าสู่ระบบอยู่แล้ว");

    await prisma.$transaction(async (tx) => {
      // ใบสมัครอื่นของผู้สมัคร (ถ้ามี) ย้ายตามไปด้วย — ข้ามรุ่นที่ประวัติเดิมสมัครไว้แล้ว
      const targetSessions = new Set(
        (await tx.application.findMany({ where: { coachId: target.id }, select: { courseSessionId: true } })).map(
          (a) => a.courseSessionId,
        ),
      );
      const sourceApps = await tx.application.findMany({ where: { coachId: source.id } });
      for (const a of sourceApps) {
        if (targetSessions.has(a.courseSessionId)) await tx.application.delete({ where: { id: a.id } });
        else await tx.application.update({ where: { id: a.id }, data: { coachId: target.id } });
      }
      if (source.systemUser) {
        await tx.systemUser.update({ where: { id: source.systemUser.id }, data: { coachId: null } });
      }
      await tx.coach.delete({ where: { id: source.id } });
      await tx.coach.update({
        where: { id: target.id },
        data: {
          idNumber: target.idNumber ?? source.idNumber,
          dob: target.dob ?? source.dob,
          gender: target.gender ?? source.gender,
          nameEn: target.nameEn ?? source.nameEn,
          familyNameEn: target.familyNameEn ?? source.familyNameEn,
          nationalityCode: target.nationalityCode ?? source.nationalityCode,
          // ช่องทางติดต่อ/รูป ใช้ของใหม่ที่ผู้สมัครเพิ่งกรอก
          telNo: source.telNo ?? target.telNo,
          email: source.email ?? target.email,
          photoUrl: source.photoUrl ?? target.photoUrl,
        },
      });
      if (source.systemUser) {
        await tx.systemUser.update({ where: { id: source.systemUser.id }, data: { coachId: target.id } });
      }
    });
    revalidateSession(sessionId, [target.id]);
    return `รวมกับประวัติเดิมของ ${target.nameTh} ${target.surnameTh} แล้ว`;
  });
}
