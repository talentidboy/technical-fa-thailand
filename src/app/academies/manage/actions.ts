"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, type CurrentUser } from "@/lib/auth";
import { audit, changedFields } from "@/lib/audit";
import { isLevel, parseFormDate, LEVEL_META, LICENCE_STATUS } from "@/lib/academy";
import type { FormResult } from "@/components/ResultForm";

async function requireAdminOrStaff() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "STAFF") throw new Error("เฉพาะผู้ดูแลระบบและเจ้าหน้าที่เท่านั้นที่ทำรายการนี้ได้");
  return user;
}

async function attempt(fn: (user: CurrentUser) => Promise<void>): Promise<FormResult> {
  try {
    const user = await requireAdminOrStaff();
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

function readAcademy(fd: FormData) {
  const nameEn = text(fd, "nameEn");
  if (!nameEn) throw new Error("กรุณากรอกชื่ออคาเดมี (ภาษาอังกฤษ)");
  const email = optional(fd, "email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("อีเมลไม่ถูกต้อง");
  const website = optional(fd, "website");
  if (website && !/^https?:\/\/\S+$/i.test(website)) throw new Error("เว็บไซต์ต้องขึ้นต้นด้วย http:// หรือ https://");
  return {
    nameEn,
    nameTh: optional(fd, "nameTh"),
    aliases: optional(fd, "aliases"),
    province: optional(fd, "province"),
    address: optional(fd, "address"),
    parentClub: optional(fd, "parentClub"),
    contactName: optional(fd, "contactName"),
    phone: optional(fd, "phone"),
    email,
    website,
    note: optional(fd, "note"),
  };
}

function readLicence(fd: FormData) {
  const level = text(fd, "level");
  if (level && !isLevel(level)) throw new Error("ระดับไม่ถูกต้อง");
  const approvedRaw = text(fd, "approvedAt");
  const expiresRaw = text(fd, "expiresAt");
  const approvedAt = approvedRaw ? parseFormDate(approvedRaw) : null;
  const expiresAt = expiresRaw ? parseFormDate(expiresRaw) : null;
  if (approvedRaw && !approvedAt) throw new Error("วันที่อนุมัติไม่ถูกต้อง");
  if (expiresRaw && !expiresAt) throw new Error("วันหมดอายุไม่ถูกต้อง");
  if (approvedAt && expiresAt && expiresAt <= approvedAt) throw new Error("วันหมดอายุต้องอยู่หลังวันที่อนุมัติ");
  return {
    level: level || null,
    tier: optional(fd, "tier"),
    licenceNo: optional(fd, "licenceNo"),
    approvedAt,
    expiresAt,
    note: optional(fd, "licenceNote"),
  };
}

const levelText = (level: string | null) => (isLevel(level) ? LEVEL_META[level].label : "ยังไม่ระบุระดับ");

// ===================== อคาเดมี =====================

export async function createAcademy(formData: FormData): Promise<FormResult> {
  let newId = 0;
  const res = await attempt(async (user) => {
    const data = readAcademy(formData);
    const licence = readLicence(formData);
    const academy = await prisma.academy.create({
      data: {
        ...data,
        // ใส่ระดับหรือวันที่อนุมัติมาด้วย = ออกใบอนุญาตใบแรกพร้อมกัน
        licences: licence.level || licence.approvedAt ? { create: licence } : undefined,
      },
    });
    newId = academy.id;
    await audit(user.email, "ACADEMY_CREATE", {
      summary: `เพิ่มอคาเดมี ${academy.nameEn}${licence.level || licence.approvedAt ? ` (${levelText(licence.level)})` : ""}`,
      details: { academyId: academy.id, ...data, licence },
    });
  });
  if (res.ok) redirect(`/academies/manage/${newId}`);
  return res;
}

export async function updateAcademy(formData: FormData) {
  return attempt(async (user) => {
    const id = idOf(formData);
    const before = await prisma.academy.findUnique({ where: { id } });
    if (!before) throw new Error("ไม่พบอคาเดมี");
    const data = readAcademy(formData);
    await prisma.academy.update({ where: { id }, data });
    const changes = changedFields(before, data);
    if (Object.keys(changes).length) {
      await audit(user.email, "ACADEMY_UPDATE", { summary: `แก้ไขข้อมูล ${data.nameEn} (${Object.keys(changes).join(", ")})`, details: { academyId: id, changes } });
    }
  });
}

export async function toggleAcademyActive(formData: FormData) {
  return attempt(async (user) => {
    const id = idOf(formData);
    const academy = await prisma.academy.findUnique({ where: { id }, select: { nameEn: true, active: true } });
    if (!academy) throw new Error("ไม่พบอคาเดมี");
    await prisma.academy.update({ where: { id }, data: { active: !academy.active } });
    await audit(user.email, "ACADEMY_UPDATE", {
      summary: `${academy.active ? "ปิดการแสดง" : "เปิดการแสดง"} ${academy.nameEn} บนหน้าสาธารณะ`,
      details: { academyId: id, active: !academy.active },
    });
  });
}

export async function deleteAcademy(formData: FormData): Promise<FormResult> {
  const res = await attempt(async (user) => {
    const id = idOf(formData);
    const academy = await prisma.academy.findUnique({ where: { id }, include: { licences: true, _count: { select: { members: true, applications: true } } } });
    if (!academy) throw new Error("ไม่พบอคาเดมี");
    // ข้อมูลในพอร์ทัล (บัญชี ใบสมัคร เอกสาร รายชื่อนักเตะ) กู้คืนจากบันทึกไม่ได้ — ให้ปิดการแสดงแทน
    if (academy._count.members || academy._count.applications) throw new Error("อคาเดมีนี้มีบัญชีหรือใบสมัครในพอร์ทัลแล้ว ลบไม่ได้ — ใช้ “ปิดการแสดงบนหน้าสาธารณะ” แทน");
    await prisma.academy.delete({ where: { id } });
    // เก็บสำเนาข้อมูลไว้ในบันทึก เผื่อต้องกู้คืน
    await audit(user.email, "ACADEMY_DELETE", { summary: `ลบอคาเดมี ${academy.nameEn} (ใบอนุญาต ${academy.licences.length} ใบ)`, details: academy });
  });
  if (res.ok) redirect("/academies/manage");
  return res;
}

// ===================== ใบอนุญาต =====================

// ออกใบใหม่ (ต่ออายุ / เลื่อนระดับ) — ติ๊ก "แทนที่ใบเดิม" = ใบที่มีผลอยู่เปลี่ยนเป็น "เลื่อนระดับ / ต่ออายุแล้ว"
export async function addLicence(formData: FormData) {
  return attempt(async (user) => {
    const academyId = idOf(formData, "academyId");
    const academy = await prisma.academy.findUnique({ where: { id: academyId }, select: { nameEn: true } });
    if (!academy) throw new Error("ไม่พบอคาเดมี");
    const licence = readLicence(formData);
    // ใบใหม่ต้องระบุระดับ — ไม่งั้นติ๊ก "แทนที่ใบเดิม" แล้วอคาเดมีจะเหลือแต่ใบที่ไม่มีระดับ
    if (!licence.level) throw new Error("กรุณาเลือกระดับของใบอนุญาตใหม่");
    const supersede = formData.get("supersede") === "on";
    await prisma.$transaction(async (tx) => {
      if (supersede) await tx.academyLicence.updateMany({ where: { academyId, status: "ACTIVE" }, data: { status: "SUPERSEDED" } });
      await tx.academyLicence.create({ data: { academyId, ...licence } });
    });
    await audit(user.email, "ACADEMY_LICENCE_ADD", {
      summary: `ออกใบอนุญาต ${levelText(licence.level)} ให้ ${academy.nameEn}${supersede ? " (แทนที่ใบเดิม)" : ""}`,
      details: { academyId, supersede, ...licence },
    });
  });
}

export async function updateLicence(formData: FormData) {
  return attempt(async (user) => {
    const id = idOf(formData);
    const before = await prisma.academyLicence.findUnique({ where: { id }, include: { academy: { select: { nameEn: true } } } });
    if (!before) throw new Error("ไม่พบใบอนุญาต");
    const status = text(formData, "status");
    if (!(status in LICENCE_STATUS)) throw new Error("สถานะไม่ถูกต้อง");
    const data = { ...readLicence(formData), status };
    await prisma.academyLicence.update({ where: { id }, data });
    const changes = changedFields(before, data);
    if (Object.keys(changes).length) {
      await audit(user.email, "ACADEMY_LICENCE_UPDATE", {
        summary: `แก้ไขใบอนุญาต ${levelText(data.level)} ของ ${before.academy.nameEn} (${Object.keys(changes).join(", ")})`,
        details: { academyId: before.academyId, licenceId: id, changes },
      });
    }
  });
}

export async function deleteLicence(formData: FormData) {
  return attempt(async (user) => {
    const id = idOf(formData);
    const licence = await prisma.academyLicence.findUnique({ where: { id }, include: { academy: { select: { nameEn: true } } } });
    if (!licence) throw new Error("ไม่พบใบอนุญาต");
    // ลบใบที่มีผลใบสุดท้าย (เช่น ออกใบใหม่ผิดแล้วลบทิ้ง) → คืนใบล่าสุดที่ถูกแทนที่ให้กลับมามีผล ไม่ให้อคาเดมีหลุดจากทะเบียน
    const restored = await prisma.$transaction(async (tx) => {
      await tx.academyLicence.delete({ where: { id } });
      if (licence.status !== "ACTIVE" || (await tx.academyLicence.count({ where: { academyId: licence.academyId, status: "ACTIVE" } }))) return null;
      const prev = await tx.academyLicence.findFirst({
        where: { academyId: licence.academyId, status: "SUPERSEDED" },
        orderBy: [{ approvedAt: { sort: "desc", nulls: "last" } }, { id: "desc" }],
      });
      return prev ? tx.academyLicence.update({ where: { id: prev.id }, data: { status: "ACTIVE" } }) : null;
    });
    await audit(user.email, "ACADEMY_LICENCE_DELETE", {
      summary: `ลบใบอนุญาต ${levelText(licence.level)} ของ ${licence.academy.nameEn}${restored ? ` · คืนใบ ${levelText(restored.level)} เดิมให้กลับมามีผล` : ""}`,
      details: { ...licence, restoredLicenceId: restored?.id ?? null },
    });
  });
}

// คืนสถานะใบอนุญาตที่ถูกแทนที่ / ระงับ ให้กลับมามีผล (แก้กรณีอคาเดมีไม่เหลือใบที่มีผล)
export async function reactivateLicence(formData: FormData) {
  return attempt(async (user) => {
    const id = idOf(formData);
    const licence = await prisma.academyLicence.findUnique({ where: { id }, include: { academy: { select: { nameEn: true } } } });
    if (!licence) throw new Error("ไม่พบใบอนุญาต");
    if (licence.status === "ACTIVE") throw new Error("ใบนี้มีผลอยู่แล้ว");
    await prisma.academyLicence.update({ where: { id }, data: { status: "ACTIVE" } });
    await audit(user.email, "ACADEMY_LICENCE_UPDATE", {
      summary: `คืนสถานะใบอนุญาต ${levelText(licence.level)} ของ ${licence.academy.nameEn} เป็นมีผล`,
      details: { academyId: licence.academyId, licenceId: id, changes: { status: [licence.status, "ACTIVE"] } },
    });
  });
}
