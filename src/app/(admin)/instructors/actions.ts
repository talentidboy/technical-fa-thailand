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

function instructorFieldsFromForm(formData: FormData) {
  return {
    email: optionalString(formData, "email"),
    telNo: optionalString(formData, "telNo"),
    affiliation: optionalString(formData, "affiliation"),
    afcInstructorId: optionalString(formData, "afcInstructorId"),
    maxLevel: optionalString(formData, "maxLevel"),
    teachesCore: formData.get("teachesCore") === "on",
    teachesGoalkeeper: formData.get("teachesGoalkeeper") === "on",
    teachesFitness: formData.get("teachesFitness") === "on",
    note: optionalString(formData, "note"),
  };
}

export async function createInstructor(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("กรุณากรอกชื่อวิทยากร");
  }

  const photoUrl = await saveUploadedPhoto(
    formData.get("photo") as File | null,
  );

  await prisma.instructor.create({
    data: {
      name,
      photoUrl,
      ...instructorFieldsFromForm(formData),
    },
  });

  revalidatePath("/instructors");
}

export async function updateInstructor(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("กรุณากรอกชื่อวิทยากร");
  }

  const newPhotoUrl = await saveUploadedPhoto(
    formData.get("photo") as File | null,
  );

  await prisma.instructor.update({
    where: { id },
    data: {
      name,
      ...instructorFieldsFromForm(formData),
      ...(newPhotoUrl ? { photoUrl: newPhotoUrl } : {}),
    },
  });

  revalidatePath("/instructors");
  redirect("/instructors");
}

export async function deleteInstructor(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await prisma.instructor.delete({ where: { id } });
  revalidatePath("/instructors");
}
