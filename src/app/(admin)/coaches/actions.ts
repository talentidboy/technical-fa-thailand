"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
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

export async function createCoach(formData: FormData) {
  await requireAdmin();

  const nameTh = String(formData.get("nameTh") ?? "").trim();
  const surnameTh = String(formData.get("surnameTh") ?? "").trim();

  if (!nameTh || !surnameTh) {
    throw new Error("กรุณากรอกชื่อและนามสกุล");
  }

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

  revalidatePath("/coaches");
  revalidatePath("/dashboard");
  redirect(`/coaches/${coach.id}`);
}

export async function updateCoach(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const nameTh = String(formData.get("nameTh") ?? "").trim();
  const surnameTh = String(formData.get("surnameTh") ?? "").trim();

  if (!nameTh || !surnameTh) {
    throw new Error("กรุณากรอกชื่อและนามสกุล");
  }

  const newPhotoUrl = await saveUploadedPhoto(
    formData.get("photo") as File | null,
  );

  await prisma.coach.update({
    where: { id },
    data: {
      nameTh,
      surnameTh,
      ...coachFieldsFromForm(formData),
      ...(newPhotoUrl ? { photoUrl: newPhotoUrl } : {}),
    },
  });

  revalidatePath("/coaches");
  revalidatePath(`/coaches/${id}`);
  revalidatePath("/dashboard");
  redirect(`/coaches/${id}`);
}

export async function deleteCoach(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  await prisma.coach.delete({ where: { id } });
  revalidatePath("/coaches");
  revalidatePath("/dashboard");
  redirect("/coaches");
}
