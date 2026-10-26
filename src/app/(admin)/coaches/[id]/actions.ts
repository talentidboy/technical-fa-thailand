"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { notifyCoaches } from "@/lib/notify";

function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function optionalDate(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value ? new Date(value) : null;
}

function optionalInt(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value ? Number(value) : null;
}

export async function createLicenseRecord(formData: FormData) {
  const admin = await requireAdmin();
  const coachId = Number(formData.get("coachId"));
  const licenseType = String(formData.get("licenseType") ?? "").trim();
  const recordType = String(formData.get("recordType") ?? "").trim();

  if (!licenseType || !recordType) {
    throw new Error("กรุณาเลือกระดับใบอนุญาตและประเภทการได้มา");
  }

  const created = await prisma.licenseRecord.create({
    data: {
      coachId,
      licenseType,
      recordType,
      isLevelUp: formData.get("isLevelUp") === "on",
      certificateNo: optionalString(formData, "certificateNo"),
      issueDate: optionalDate(formData, "issueDate"),
      expireDate: optionalDate(formData, "expireDate"),
      instructorId: optionalInt(formData, "instructorId"),
    },
  });
  await audit(admin.email, "LICENSE_CREATE", { coachId, summary: `เพิ่มใบอนุญาต ${licenseType} ${created.certificateNo ?? ""}`.trim(), details: created });

  revalidatePath(`/coaches/${coachId}`);
  revalidatePath("/dashboard");
}

// อนุญาตให้ Admin และ Staff ยืนยันอัปเกรดระดับได้ทั้งคู่ แต่ต้องติ๊กยืนยันว่าผู้ฝึกสอนผ่านการประเมินก่อนเสมอ
export async function confirmLicenseUpgrade(formData: FormData) {
  // ออกใบอนุญาตระดับใหม่ได้เฉพาะผู้ดูแลระบบ (เดิม requireUser ทำให้บัญชีโค้ชเรียกได้)
  const approver = await requireAdmin();
  const coachId = Number(formData.get("coachId"));
  const licenseType = String(formData.get("licenseType") ?? "").trim();
  const recordType = String(formData.get("recordType") ?? "").trim();
  const confirmedPass = formData.get("confirmedPass") === "on";

  if (!licenseType || !recordType) {
    throw new Error("ข้อมูลระดับใบอนุญาตไม่ถูกต้อง");
  }
  if (!confirmedPass) {
    throw new Error("กรุณายืนยันว่าผู้ฝึกสอนผ่านการประเมิน/อบรมระดับนี้แล้ว");
  }

  const created = await prisma.licenseRecord.create({
    data: {
      coachId,
      licenseType,
      recordType,
      isLevelUp: true,
      certificateNo: optionalString(formData, "certificateNo"),
      issueDate: optionalDate(formData, "issueDate"),
      expireDate: optionalDate(formData, "expireDate"),
      confirmedBy: approver.email,
      instructorId: optionalInt(formData, "instructorId"),
    },
  });
  await audit(approver.email, "LICENSE_UPGRADE", { coachId, summary: `ยืนยันอัปเกรดเป็นระดับ ${licenseType}`, details: created });
  await notifyCoaches([{ coachId, type: "LICENSE_ISSUED", title: `ได้รับใบอนุญาตระดับ ${licenseType}`, body: "ดาวน์โหลด Diploma / Licence ได้ในหน้าใบอนุญาตของฉัน", href: "/me", key: `license:${created.id}` }]);

  revalidatePath(`/coaches/${coachId}`);
  revalidatePath("/dashboard");
}

export async function deleteLicenseRecord(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  const coachId = Number(formData.get("coachId"));
  const record = await prisma.licenseRecord.findUnique({ where: { id } });
  await prisma.licenseRecord.delete({ where: { id } });
  if (record) await audit(admin.email, "LICENSE_DELETE", { coachId, summary: `ลบใบอนุญาต ${record.licenseType} ${record.certificateNo ?? ""}`.trim(), details: record });
  revalidatePath(`/coaches/${coachId}`);
  revalidatePath("/dashboard");
}

export async function createEmployment(formData: FormData) {
  await requireAdmin();
  const coachId = Number(formData.get("coachId"));
  const clubName = String(formData.get("clubName") ?? "").trim();

  if (!clubName) {
    throw new Error("กรุณากรอกชื่อสโมสร");
  }

  await prisma.employment.create({
    data: {
      coachId,
      clubName,
      division: optionalString(formData, "division"),
      position: optionalString(formData, "position"),
    },
  });

  revalidatePath(`/coaches/${coachId}`);
}

export async function deleteEmployment(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const coachId = Number(formData.get("coachId"));
  await prisma.employment.delete({ where: { id } });
  revalidatePath(`/coaches/${coachId}`);
}
