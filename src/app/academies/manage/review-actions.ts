"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, hashPassword, type CurrentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notifyAcademy, APPLICATION_KINDS } from "@/lib/academy-portal";
import { isLevel, parseFormDate, LEVEL_META } from "@/lib/academy";
import { nextLicenceNo } from "@/lib/academy-data";
import type { FormResult } from "@/components/ResultForm";

async function attempt(fn: (user: CurrentUser) => Promise<void>): Promise<FormResult> {
  try {
    const user = await requireUser();
    if (user.role !== "ADMIN" && user.role !== "STAFF") throw new Error("เฉพาะผู้ดูแลระบบและเจ้าหน้าที่เท่านั้นที่ทำรายการนี้ได้");
    await fn(user);
    revalidatePath("/academies", "layout");
    return { ok: true };
  } catch (err) {
    unstable_rethrow(err);
    return { ok: false, error: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ" };
  }
}

const text = (fd: FormData, key: string) =>
  String(fd.get(key) ?? "")
    .replace(/\r\n?/g, "\n")
    .trim();
const optional = (fd: FormData, key: string) => text(fd, key) || null;
const idOf = (fd: FormData, key = "id") => {
  const id = Number(fd.get(key));
  if (!Number.isInteger(id) || id <= 0) throw new Error("ไม่พบรายการ");
  return id;
};

// ===================== บัญชีผู้ดูแลอคาเดมี =====================
export async function decideMember(formData: FormData) {
  return attempt(async (admin) => {
    const id = idOf(formData);
    const approve = text(formData, "decision") === "APPROVE";
    const member = await prisma.academyMember.findUnique({ where: { id }, include: { academy: { select: { nameEn: true } }, user: { select: { email: true } } } });
    if (!member) throw new Error("ไม่พบคำขอ");
    const note = optional(formData, "note");
    if (!approve && !note) throw new Error("กรุณาระบุเหตุผลที่ไม่อนุมัติ");
    await prisma.academyMember.update({ where: { id }, data: { status: approve ? "APPROVED" : "REJECTED", note: approve ? member.note : note } });
    if (approve) await notifyAcademy(member.academyId, { title: `${member.name} ได้รับสิทธิ์ดูแลอคาเดมีแล้ว`, link: "/academies/portal" });
    await audit(admin.email, "ACADEMY_ACCOUNT", {
      summary: `${approve ? "อนุมัติ" : "ไม่อนุมัติ"}สิทธิ์ดูแล ${member.academy.nameEn} ของ ${member.user.email}`,
      details: { academyId: member.academyId, memberId: id, note },
    });
  });
}

export async function createAcademyAccount(formData: FormData) {
  return attempt(async (admin) => {
    const academyId = idOf(formData, "academyId");
    const email = text(formData, "email").toLowerCase();
    const name = text(formData, "name");
    const password = String(formData.get("password") ?? "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("อีเมลไม่ถูกต้อง");
    if (!name) throw new Error("กรุณากรอกชื่อผู้ดูแล");
    if (password.length < 8) throw new Error("รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร");
    if (await prisma.systemUser.findUnique({ where: { email } })) throw new Error("อีเมลนี้มีบัญชีอยู่แล้ว");
    const academy = await prisma.academy.findUnique({ where: { id: academyId }, select: { nameEn: true } });
    if (!academy) throw new Error("ไม่พบอคาเดมี");
    await prisma.systemUser.create({
      data: {
        email,
        role: "ACADEMY",
        passwordHash: await hashPassword(password),
        academyMember: { create: { academyId, name, phone: optional(formData, "phone"), status: "APPROVED" } },
      },
    });
    await audit(admin.email, "ACADEMY_ACCOUNT", { summary: `สร้างบัญชีผู้ดูแล ${academy.nameEn} (${email})`, details: { academyId, email } });
  });
}

export async function resetAcademyPassword(formData: FormData) {
  return attempt(async (admin) => {
    const member = await prisma.academyMember.findUnique({ where: { id: idOf(formData) }, include: { user: true } });
    if (!member) throw new Error("ไม่พบบัญชี");
    const password = String(formData.get("password") ?? "");
    if (password.length < 8) throw new Error("รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร");
    await prisma.$transaction([
      prisma.systemUser.update({ where: { id: member.userId }, data: { passwordHash: await hashPassword(password) } }),
      prisma.session.deleteMany({ where: { userId: member.userId } }), // ออกจากระบบทุกเครื่อง
    ]);
    await audit(admin.email, "ACADEMY_ACCOUNT", { summary: `ตั้งรหัสผ่านใหม่ให้ ${member.user.email}`, details: { academyId: member.academyId, memberId: member.id } });
  });
}

export async function toggleAcademyAccount(formData: FormData) {
  return attempt(async (admin) => {
    const member = await prisma.academyMember.findUnique({ where: { id: idOf(formData) }, include: { user: true } });
    if (!member) throw new Error("ไม่พบบัญชี");
    await prisma.systemUser.update({ where: { id: member.userId }, data: { isActive: !member.user.isActive } });
    if (member.user.isActive) await prisma.session.deleteMany({ where: { userId: member.userId } });
    await audit(admin.email, "ACADEMY_ACCOUNT", {
      summary: `${member.user.isActive ? "ระงับ" : "เปิดใช้"}บัญชี ${member.user.email}`,
      details: { academyId: member.academyId, memberId: member.id },
    });
  });
}

// ลบบัญชีผู้ดูแลอคาเดมีถาวร (เฉพาะผู้ดูแลระบบ) — ข้อมูลอคาเดมี ทีม และใบสมัครยังอยู่ครบ · ลบได้เฉพาะบัญชีประเภทอคาเดมี
export async function deleteAcademyAccount(formData: FormData) {
  return attempt(async (admin) => {
    if (admin.role !== "ADMIN") throw new Error("เฉพาะผู้ดูแลระบบเท่านั้นที่ลบบัญชีได้");
    const member = await prisma.academyMember.findUnique({ where: { id: idOf(formData) }, include: { user: true, academy: { select: { nameEn: true } } } });
    if (!member) throw new Error("ไม่พบบัญชี");
    if (member.user.role !== "ACADEMY") throw new Error("ลบได้เฉพาะบัญชีอคาเดมี");
    // ลบผู้ใช้ = ลบสิทธิ์ดูแลและ session ไปด้วย (cascade)
    await prisma.systemUser.delete({ where: { id: member.userId } });
    await audit(admin.email, "ACADEMY_ACCOUNT", {
      summary: `ลบบัญชี ${member.user.email} (ผู้ดูแล ${member.academy.nameEn})`,
      details: { academyId: member.academyId, memberId: member.id, email: member.user.email },
    });
  });
}

// ===================== ตรวจใบสมัคร =====================
async function reviewable(applicationId: number) {
  const app = await prisma.academyApplication.findUnique({ where: { id: applicationId }, include: { academy: { select: { nameEn: true } }, evidence: true } });
  if (!app) throw new Error("ไม่พบใบสมัคร");
  if (app.status !== "SUBMITTED") throw new Error("ตรวจได้เฉพาะใบสมัครที่อคาเดมีส่งแล้ว (สถานะรอตรวจ)");
  return app;
}

export async function reviewEvidence(formData: FormData) {
  return attempt(async (admin) => {
    const ev = await prisma.academyEvidence.findUnique({ where: { id: idOf(formData) } });
    if (!ev) throw new Error("ไม่พบรายการ");
    await reviewable(ev.applicationId);
    const status = text(formData, "status");
    if (!["PENDING", "PASS", "FIX", "FAIL"].includes(status)) throw new Error("กรุณาเลือกผลการตรวจ");
    const reviewNote = optional(formData, "reviewNote");
    if ((status === "FIX" || status === "FAIL") && !reviewNote) throw new Error("กรุณาระบุสิ่งที่ต้องแก้ไข / เหตุผล");
    await prisma.academyEvidence.update({ where: { id: ev.id }, data: { status, reviewNote, reviewedAt: new Date(), reviewedBy: admin.email } });
  });
}

// ผ่านทุกข้อที่ยังรอตรวจ (ใช้เมื่อเปิดดูครบแล้ว)
export async function passAllPending(formData: FormData) {
  return attempt(async (admin) => {
    const app = await reviewable(idOf(formData));
    await prisma.academyEvidence.updateMany({ where: { applicationId: app.id, status: "PENDING" }, data: { status: "PASS", reviewedAt: new Date(), reviewedBy: admin.email } });
  });
}

export async function requestFix(formData: FormData) {
  return attempt(async (admin) => {
    const app = await reviewable(idOf(formData));
    const toFix = app.evidence.filter((e) => e.status === "FIX" || e.status === "FAIL");
    if (!toFix.length) throw new Error("ยังไม่มีข้อที่ทำเครื่องหมาย “ต้องแก้ไข” หรือ “ไม่ผ่าน”");
    const note = optional(formData, "note");
    await prisma.academyApplication.update({ where: { id: app.id }, data: { status: "NEEDS_FIX", decisionNote: note } });
    await notifyAcademy(app.academyId, {
      title: `ใบสมัคร FAT ${LEVEL_META[app.level as keyof typeof LEVEL_META]?.label} ต้องแก้ไข ${toFix.length} ข้อ`,
      // แจ้งทีละข้อว่าต้องแก้อะไร (ตามความเห็นที่ผู้ตรวจเขียนไว้)
      body: [note, ...toFix.map((e) => `• ข้อ ${e.criterion}${e.reviewNote ? `: ${e.reviewNote}` : ""}`)].filter(Boolean).join("\n"),
      link: `/academies/portal/applications/${app.id}`,
    });
    await audit(admin.email, "ACADEMY_REVIEW", { summary: `ส่งใบสมัครของ ${app.academy.nameEn} กลับให้แก้ไข ${toFix.length} ข้อ`, details: { academyId: app.academyId, applicationId: app.id } });
  });
}

export async function approveApplication(formData: FormData) {
  return attempt(async (admin) => {
    const app = await reviewable(idOf(formData));
    if (!isLevel(app.level)) throw new Error("ระดับในใบสมัครไม่ถูกต้อง");
    const notPassed = app.evidence.filter((e) => e.status !== "PASS");
    if (notPassed.length) throw new Error(`ยังมี ${notPassed.length} ข้อที่ยังไม่ผ่าน (${notPassed.map((e) => e.criterion).join(", ")})`);
    const expiresRaw = text(formData, "expiresAt");
    const expiresAt = expiresRaw ? parseFormDate(expiresRaw) : null;
    if (expiresRaw && !expiresAt) throw new Error("วันหมดอายุไม่ถูกต้อง");
    const now = new Date();
    if (expiresAt && expiresAt <= now) throw new Error("วันหมดอายุต้องเป็นวันในอนาคต");
    const note = optional(formData, "note");
    const level = app.level;
    // เลขที่ใบอนุญาตเว้นว่าง = ออกเลขรูปแบบมาตรฐานให้อัตโนมัติ
    const licenceNo = optional(formData, "licenceNo") ?? (await nextLicenceNo(level, now));
    if (await prisma.academyLicence.findFirst({ where: { licenceNo } })) throw new Error(`เลขที่ใบอนุญาต ${licenceNo} ถูกใช้แล้ว`);
    await prisma.$transaction(async (tx) => {
      await tx.academyLicence.updateMany({ where: { academyId: app.academyId, status: "ACTIVE" }, data: { status: "SUPERSEDED" } });
      const licence = await tx.academyLicence.create({
        data: {
          academyId: app.academyId,
          level,
          tier: optional(formData, "tier"),
          licenceNo,
          approvedAt: now,
          expiresAt,
          note: `อนุมัติจากใบสมัคร #${app.id} (${APPLICATION_KINDS[app.kind]})`,
        },
      });
      await tx.academyApplication.update({ where: { id: app.id }, data: { status: "APPROVED", decidedAt: now, decidedBy: admin.email, decisionNote: note, licenceId: licence.id } });
      await tx.academy.update({ where: { id: app.academyId }, data: { active: true } });
    });
    await notifyAcademy(app.academyId, {
      title: `ยินดีด้วย! ได้รับใบอนุญาต FAT ${LEVEL_META[level].label} Level Academy`,
      body: note ?? undefined,
      link: "/academies/portal",
    });
    await audit(admin.email, "ACADEMY_REVIEW", { summary: `อนุมัติใบสมัคร ${LEVEL_META[level].label} ของ ${app.academy.nameEn}`, details: { academyId: app.academyId, applicationId: app.id } });
  });
}

export async function rejectApplication(formData: FormData) {
  return attempt(async (admin) => {
    const app = await reviewable(idOf(formData));
    const note = optional(formData, "note");
    if (!note) throw new Error("กรุณาระบุเหตุผลที่ไม่อนุมัติ");
    await prisma.academyApplication.update({ where: { id: app.id }, data: { status: "REJECTED", decidedAt: new Date(), decidedBy: admin.email, decisionNote: note } });
    await notifyAcademy(app.academyId, {
      title: `ใบสมัคร FAT ${LEVEL_META[app.level as keyof typeof LEVEL_META]?.label} ไม่ได้รับอนุมัติ`,
      body: note,
      link: `/academies/portal/applications/${app.id}`,
    });
    await audit(admin.email, "ACADEMY_REVIEW", { summary: `ไม่อนุมัติใบสมัครของ ${app.academy.nameEn}`, details: { academyId: app.academyId, applicationId: app.id, note } });
  });
}

// ดึงใบสมัครที่ส่งกลับให้แก้ / ไม่อนุมัติ กลับมาเป็น "รอตรวจ" (เช่น ตัดสินผิด หรืออคาเดมีส่งเอกสารเพิ่มทางอื่นแล้ว)
export async function reopenApplication(formData: FormData) {
  return attempt(async (admin) => {
    const app = await prisma.academyApplication.findUnique({ where: { id: idOf(formData) }, include: { academy: { select: { nameEn: true } } } });
    if (!app) throw new Error("ไม่พบใบสมัคร");
    if (app.status !== "NEEDS_FIX" && app.status !== "REJECTED") throw new Error("เปิดตรวจใหม่ได้เฉพาะใบสมัครที่ส่งกลับให้แก้ไขหรือไม่อนุมัติ");
    await prisma.academyApplication.update({ where: { id: app.id }, data: { status: "SUBMITTED", decidedAt: null, decidedBy: null } });
    await notifyAcademy(app.academyId, {
      title: `สมาคมฯ เปิดตรวจใบสมัคร FAT ${LEVEL_META[app.level as keyof typeof LEVEL_META]?.label} อีกครั้ง`,
      body: "ระหว่างตรวจจะแก้ไขใบสมัครไม่ได้",
      link: `/academies/portal/applications/${app.id}`,
    });
    await audit(admin.email, "ACADEMY_REVIEW", { summary: `เปิดตรวจใบสมัครของ ${app.academy.nameEn} อีกครั้ง`, details: { academyId: app.academyId, applicationId: app.id, from: app.status } });
  });
}
