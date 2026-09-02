"use server";

import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/auth";
import { saveUploadedPhoto } from "@/lib/upload";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

// โค้ชแก้ไขข้อมูลโปรไฟล์ของตัวเองได้ทันที ไม่ต้องรอแอดมินอนุมัติ
// จำกัดเฉพาะข้อมูลติดต่อ/ข้อมูลทั่วไป — ชื่อไทย, เลขบัตรประชาชน, วันเกิด (ข้อมูลยืนยันตัวตน) แก้ไขได้เฉพาะแอดมินเท่านั้น
export async function updateMyProfile(formData: FormData) {
  const user = await requireCoach();
  const coachId = user.coachId!;

  const telNo = String(formData.get("telNo") ?? "").trim();
  if (!telNo) throw new Error("กรุณากรอกเบอร์โทรศัพท์");

  let photoUrl: string | null = null;
  try {
    photoUrl = await saveUploadedPhoto(formData.get("photo") as File | null);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "อัปโหลดรูปถ่ายไม่สำเร็จ");
  }

  await prisma.coach.update({
    where: { id: coachId },
    data: {
      telNo,
      nameEn: optionalString(formData, "nameEn"),
      familyNameEn: optionalString(formData, "familyNameEn"),
      gender: optionalString(formData, "gender"),
      nationalityCode: optionalString(formData, "nationalityCode"),
      provinceCode: optionalString(formData, "provinceCode"),
      districtCode: optionalString(formData, "districtCode"),
      subdistrictCode: optionalString(formData, "subdistrictCode"),
      ...(photoUrl ? { photoUrl } : {}),
    },
  });

  revalidatePath("/me");
  redirect("/me?saved=1");
}
