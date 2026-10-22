"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit, changedFields } from "@/lib/audit";
import { saveUploadedPhoto } from "@/lib/upload";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function optionalDate(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value ? new Date(value) : null;
}

function coachFieldsFromForm(formData: FormData) {
  return {
    nameEn: optionalString(formData, "nameEn"),
    familyNameEn: optionalString(formData, "familyNameEn"),
    gender: optionalString(formData, "gender"),
    dob: optionalDate(formData, "dob"),
    afcId: optionalString(formData, "afcId"),
    idNumber: optionalString(formData, "idNumber"),
    passportNumber: optionalString(formData, "passportNumber"),
    email: optionalString(formData, "email"),
    telNo: optionalString(formData, "telNo"),
    nationalityCode: optionalString(formData, "nationalityCode"),
    provinceCode: optionalString(formData, "provinceCode"),
    districtCode: optionalString(formData, "districtCode"),
    subdistrictCode: optionalString(formData, "subdistrictCode"),
  };
}

// ต้องมีชื่อ-นามสกุลไทย หรืออังกฤษ อย่างน้อยหนึ่งชุด (ผู้ฝึกสอนต่างชาติไม่มีชื่อไทย)
function requireName(formData: FormData) {
  const nameTh = String(formData.get("nameTh") ?? "").trim();
  const surnameTh = String(formData.get("surnameTh") ?? "").trim();
  const hasTh = !!nameTh && !!surnameTh;
  const hasEn = !!optionalString(formData, "nameEn") && !!optionalString(formData, "familyNameEn");
  if (!hasTh && !hasEn) throw new Error("กรุณากรอกชื่อ-นามสกุล (ภาษาไทย หรือ ภาษาอังกฤษ)");
  return { nameTh, surnameTh };
}

export async function createCoach(formData: FormData) {
  const admin = await requireAdmin();
  const { nameTh, surnameTh } = requireName(formData);

  const photoUrl = await saveUploadedPhoto(
    formData.get("photo") as File | null,
  );

  const coach = await prisma.coach.create({
    data: {
      nameTh,
      surnameTh,
      photoUrl,
      ...coachFieldsFromForm(formData),
    },
  });

  await audit(admin.email, "COACH_CREATE", { coachId: coach.id, summary: `เพิ่มผู้ฝึกสอน ${nameTh || coach.nameEn} ${surnameTh || coach.familyNameEn}`.trim() });
  revalidatePath("/coaches");
  revalidatePath("/dashboard");
  redirect(`/coaches/${coach.id}`);
}

export async function updateCoach(formData: FormData) {
  const admin = await requireAdmin();

  const id = Number(formData.get("id"));
  const { nameTh, surnameTh } = requireName(formData);
  const before = await prisma.coach.findUnique({ where: { id } });

  const newPhotoUrl = await saveUploadedPhoto(
    formData.get("photo") as File | null,
  );

  const data = {
    nameTh,
    surnameTh,
    ...coachFieldsFromForm(formData),
    ...(newPhotoUrl ? { photoUrl: newPhotoUrl } : {}),
  };
  await prisma.coach.update({ where: { id }, data });
  if (before) {
    const diff = changedFields(before as unknown as Record<string, unknown>, data);
    if (Object.keys(diff).length) await audit(admin.email, "COACH_UPDATE", { coachId: id, summary: `แก้ไข ${Object.keys(diff).join(", ")}`, details: diff });
  }

  revalidatePath("/coaches");
  revalidatePath(`/coaches/${id}`);
  revalidatePath("/dashboard");
  redirect(`/coaches/${id}`);
}

export async function deleteCoach(formData: FormData) {
  const admin = await requireAdmin();

  const id = Number(formData.get("id"));
  // เก็บสำเนาข้อมูลก่อนลบ (ใบอนุญาตจะถูกลบตามไปด้วย)
  const snapshot = await prisma.coach.findUnique({ where: { id }, include: { licenseRecords: true, employments: true } });
  await prisma.coach.delete({ where: { id } });
  if (snapshot) {
    await audit(admin.email, "COACH_DELETE", {
      coachId: id,
      summary: `ลบผู้ฝึกสอน ${snapshot.nameTh || snapshot.nameEn} ${snapshot.surnameTh || snapshot.familyNameEn} (ใบอนุญาต ${snapshot.licenseRecords.length} ใบ)`,
      details: snapshot,
    });
  }
  revalidatePath("/coaches");
  revalidatePath("/dashboard");
  redirect("/coaches");
}
