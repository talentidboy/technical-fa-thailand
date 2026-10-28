"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, type CurrentUser } from "@/lib/auth";
import { audit, changedFields } from "@/lib/audit";
import { ISSUE_KINDS, bangkokDay, currentLicence, isLevel, parseFormDate, LEVEL_META } from "@/lib/academy";
import { nextLicenceNo } from "@/lib/academy-data";
import { saveUploadedPhoto } from "@/lib/upload";
import { removeStoredDocument } from "@/lib/academy-docs";
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

// ไฟล์โลโก้ที่แนบมา (ไม่แนบ = null)
const logoFile = (fd: FormData) => {
  const f = fd.get("logo");
  return f instanceof File && f.size > 0 ? f : null;
};

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
    const data = { ...readAcademy(formData), logoUrl: await saveUploadedPhoto(logoFile(formData)) };
    const licence = readLicence(formData);
    if (isLevel(licence.level) && !licence.licenceNo) licence.licenceNo = await nextLicenceNo(licence.level, licence.approvedAt ?? new Date());
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
    const logo = await saveUploadedPhoto(logoFile(formData));
    const data = { ...readAcademy(formData), logoUrl: logo ?? (formData.get("removeLogo") === "on" ? null : before.logoUrl) };
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
    const academy = await prisma.academy.findUnique({
      where: { id },
      include: {
        licences: true,
        members: { select: { userId: true, user: { select: { email: true, role: true } } } },
        documents: { select: { fileKey: true } },
        _count: { select: { applications: true, staff: true, teams: true } },
      },
    });
    if (!academy) throw new Error("ไม่พบอคาเดมี");
    // มีข้อมูลในพอร์ทัล (บัญชี ใบสมัคร เอกสาร รายชื่อนักเตะ) = กู้คืนจากบันทึกไม่ได้ → เฉพาะผู้ดูแลระบบ และต้องพิมพ์ชื่ออคาเดมียืนยัน
    const portal = academy.members.length > 0 || academy._count.applications > 0;
    if (portal) {
      if (user.role !== "ADMIN") throw new Error("อคาเดมีนี้มีบัญชีหรือใบสมัครในพอร์ทัลแล้ว — เฉพาะผู้ดูแลระบบเท่านั้นที่ลบได้ (เจ้าหน้าที่ใช้ “ปิดการแสดง” แทน)");
      if (text(formData, "confirmName") !== academy.nameEn) throw new Error(`พิมพ์ชื่ออคาเดมี “${academy.nameEn}” ให้ตรงเพื่อยืนยันการลบ`);
    }
    // บัญชีผู้ดูแลของอคาเดมีนี้ลบไปด้วย (ไม่เหลือบัญชีที่ไม่มีอคาเดมีให้ดูแล) · ข้อมูลอื่นลบตามอคาเดมี (cascade)
    const accountIds = academy.members.filter((m) => m.user.role === "ACADEMY").map((m) => m.userId);
    await prisma.$transaction([prisma.systemUser.deleteMany({ where: { id: { in: accountIds }, role: "ACADEMY" } }), prisma.academy.delete({ where: { id } })]);
    for (const d of academy.documents) await removeStoredDocument(d.fileKey);
    // เก็บสำเนาข้อมูลทะเบียนไว้ในบันทึก เผื่อต้องกู้คืน (ไม่เก็บข้อมูลนักเตะซึ่งเป็นผู้เยาว์)
    const { members, documents, _count, ...registry } = academy;
    await audit(user.email, "ACADEMY_DELETE", {
      summary: `ลบอคาเดมี ${academy.nameEn} (ใบอนุญาต ${academy.licences.length} ใบ${portal ? ` · บัญชี ${members.length} · ใบสมัคร ${_count.applications} · เอกสาร ${documents.length} · ทีม ${_count.teams}` : ""})`,
      details: { ...registry, accounts: members.map((m) => m.user.email) },
    });
  });
  if (res.ok) redirect("/academies/manage/academies");
  return res;
}

// ===================== ใบอนุญาต =====================
// วงจรมาตรฐาน: ออกใบ → (ต่ออายุ / เปลี่ยนระดับ = ออกใบใหม่แทนใบเดิม) → พักใช้ ↔ คืนสถานะ
// สถานะเปลี่ยนได้เฉพาะผ่านคำสั่งเหล่านี้ — ฟอร์มแก้ไขใช้แก้รายละเอียดที่บันทึกผิดเท่านั้น จึงไม่เกิดอคาเดมีที่ไม่มีใบที่มีผลโดยไม่ตั้งใจ

export async function issueLicence(formData: FormData) {
  return attempt(async (user) => {
    const academyId = idOf(formData, "academyId");
    const kind = text(formData, "kind") as keyof typeof ISSUE_KINDS;
    if (!(kind in ISSUE_KINDS)) throw new Error("ไม่รู้จักคำสั่ง");
    const academy = await prisma.academy.findUnique({ where: { id: academyId }, include: { licences: { where: { status: "ACTIVE" } } } });
    if (!academy) throw new Error("ไม่พบอคาเดมี");
    const current = currentLicence(academy.licences);
    const input = readLicence(formData);

    let level = input.level;
    if (kind === "NEW") {
      if (current) throw new Error("อคาเดมีนี้มีใบอนุญาตที่มีผลอยู่แล้ว — ใช้ “ต่ออายุ” หรือ “เปลี่ยนระดับ” แทน");
      if (!level) throw new Error("กรุณาเลือกระดับ");
    } else {
      if (!current) throw new Error("ไม่มีใบอนุญาตที่มีผลให้ต่ออายุหรือเปลี่ยนระดับ — ใช้ “ออกใบอนุญาต”");
      if (kind === "RENEW") {
        if (!isLevel(current.level)) throw new Error("ใบเดิมยังไม่ระบุระดับ — ใช้ “เปลี่ยนระดับ” เพื่อกำหนดระดับ");
        level = current.level;
      } else {
        if (!level) throw new Error("กรุณาเลือกระดับใหม่");
        if (level === current.level) throw new Error("ระดับใหม่ต้องต่างจากระดับเดิม — ถ้าระดับเดิมให้ใช้ “ต่ออายุ”");
      }
    }
    if (!isLevel(level)) throw new Error("กรุณาเลือกระดับ");
    const approvedAt = input.approvedAt ?? parseFormDate(bangkokDay(new Date()))!;
    if (input.expiresAt && input.expiresAt <= approvedAt) throw new Error("วันหมดอายุต้องอยู่หลังวันที่อนุมัติ");
    const licenceNo = input.licenceNo ?? (await nextLicenceNo(level, approvedAt));
    if (await prisma.academyLicence.findFirst({ where: { licenceNo } })) throw new Error(`เลขที่ใบอนุญาต ${licenceNo} ถูกใช้แล้ว`);
    const origin = kind === "RENEW" ? "ต่ออายุจากใบเดิม" : kind === "CHANGE" ? `เปลี่ยนระดับจาก ${levelText(current!.level)}` : null;

    await prisma.$transaction(async (tx) => {
      if (current) await tx.academyLicence.updateMany({ where: { academyId, status: "ACTIVE" }, data: { status: "SUPERSEDED" } });
      await tx.academyLicence.create({
        data: { academyId, level, tier: input.tier, licenceNo, approvedAt, expiresAt: input.expiresAt, note: [origin, input.note].filter(Boolean).join(" · ") || null },
      });
    });
    await audit(user.email, "ACADEMY_LICENCE_ADD", {
      summary: `${ISSUE_KINDS[kind]} ${levelText(level)} ให้ ${academy.nameEn} (${licenceNo})`,
      details: { academyId, kind, level, licenceNo, approvedAt, expiresAt: input.expiresAt, replacedLicenceId: current?.id ?? null },
    });
  });
}

// พักใช้ / เพิกถอนใบที่มีผล (ต้องระบุเหตุผล) → อคาเดมีไม่แสดงบนหน้าสาธารณะ
export async function revokeLicence(formData: FormData) {
  return attempt(async (user) => {
    const id = idOf(formData);
    const reason = text(formData, "reason");
    if (!reason) throw new Error("กรุณาระบุเหตุผลที่พักใช้ใบอนุญาต");
    const licence = await prisma.academyLicence.findUnique({ where: { id }, include: { academy: { select: { nameEn: true } } } });
    if (!licence) throw new Error("ไม่พบใบอนุญาต");
    if (licence.status !== "ACTIVE") throw new Error("พักใช้ได้เฉพาะใบที่มีผลอยู่");
    const stamp = `พักใช้ ${bangkokDay(new Date())}: ${reason}`;
    await prisma.academyLicence.update({ where: { id }, data: { status: "REVOKED", note: [licence.note, stamp].filter(Boolean).join(" · ") } });
    await audit(user.email, "ACADEMY_LICENCE_UPDATE", {
      summary: `พักใช้ใบอนุญาต ${levelText(licence.level)} ของ ${licence.academy.nameEn} — ${reason}`,
      details: { academyId: licence.academyId, licenceId: id, changes: { status: [licence.status, "REVOKED"] }, reason },
    });
  });
}

// คืนสถานะใบที่ถูกพักใช้ / ถูกแทนที่ ให้กลับมามีผล (ได้เมื่ออคาเดมีไม่มีใบอื่นที่มีผลอยู่)
export async function reactivateLicence(formData: FormData) {
  return attempt(async (user) => {
    const id = idOf(formData);
    const licence = await prisma.academyLicence.findUnique({ where: { id }, include: { academy: { select: { nameEn: true } } } });
    if (!licence) throw new Error("ไม่พบใบอนุญาต");
    if (licence.status === "ACTIVE") throw new Error("ใบนี้มีผลอยู่แล้ว");
    if (await prisma.academyLicence.count({ where: { academyId: licence.academyId, status: "ACTIVE" } }))
      throw new Error("อคาเดมีนี้มีใบอื่นที่มีผลอยู่แล้ว — คืนสถานะซ้อนไม่ได้");
    await prisma.academyLicence.update({ where: { id }, data: { status: "ACTIVE" } });
    await audit(user.email, "ACADEMY_LICENCE_UPDATE", {
      summary: `คืนสถานะใบอนุญาต ${levelText(licence.level)} ของ ${licence.academy.nameEn} เป็นมีผล`,
      details: { academyId: licence.academyId, licenceId: id, changes: { status: [licence.status, "ACTIVE"] } },
    });
  });
}

// แก้รายละเอียดที่บันทึกผิด (ระดับ เลขที่ วันที่ หมายเหตุ) — ไม่เปลี่ยนสถานะ
export async function updateLicence(formData: FormData) {
  return attempt(async (user) => {
    const id = idOf(formData);
    const before = await prisma.academyLicence.findUnique({ where: { id }, include: { academy: { select: { nameEn: true } } } });
    if (!before) throw new Error("ไม่พบใบอนุญาต");
    const data = readLicence(formData);
    if (data.licenceNo && (await prisma.academyLicence.findFirst({ where: { licenceNo: data.licenceNo, id: { not: id } } }))) throw new Error(`เลขที่ใบอนุญาต ${data.licenceNo} ถูกใช้แล้ว`);
    await prisma.academyLicence.update({ where: { id }, data });
    const changes = changedFields(before, data);
    if (Object.keys(changes).length) {
      await audit(user.email, "ACADEMY_LICENCE_UPDATE", {
        summary: `แก้ไขรายละเอียดใบอนุญาต ${levelText(data.level)} ของ ${before.academy.nameEn} (${Object.keys(changes).join(", ")})`,
        details: { academyId: before.academyId, licenceId: id, changes },
      });
    }
  });
}

// ลบใบที่บันทึกผิด — ถ้าลบใบที่มีผลใบสุดท้าย คืนใบล่าสุดที่ถูกแทนที่ให้กลับมามีผล ไม่ให้อคาเดมีหลุดจากทะเบียน
export async function deleteLicence(formData: FormData) {
  return attempt(async (user) => {
    const id = idOf(formData);
    const licence = await prisma.academyLicence.findUnique({ where: { id }, include: { academy: { select: { nameEn: true } } } });
    if (!licence) throw new Error("ไม่พบใบอนุญาต");
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
