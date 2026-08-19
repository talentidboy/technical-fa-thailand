"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { saveUploadedPhoto } from "@/lib/upload";
import { revalidatePath } from "next/cache";

async function requireAdminOrStaff() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    throw new Error("เฉพาะผู้ดูแลระบบและเจ้าหน้าที่เท่านั้นที่ทำรายการนี้ได้");
  }
  return user;
}

export async function createTrainingArticle(formData: FormData) {
  const user = await requireAdminOrStaff();

  const title = String(formData.get("title") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const theme = String(formData.get("theme") ?? "").trim();
  const ageGroup = String(formData.get("ageGroup") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!title || !area || !excerpt) {
    throw new Error("กรุณากรอกหัวข้อ, หมวด Area และรายละเอียดย่อ");
  }

  const coverImageUrl = await saveUploadedPhoto(
    formData.get("coverImage") as File | null,
  );

  await prisma.trainingArticle.create({
    data: {
      title,
      area,
      theme: theme || null,
      ageGroup: ageGroup || null,
      excerpt,
      content: content || excerpt,
      coverImageUrl,
      authorId: user.id,
    },
  });

  revalidatePath("/training-centre");
  revalidatePath("/training-centre/manage");
}

export async function deleteTrainingArticle(formData: FormData) {
  await requireAdminOrStaff();
  const id = Number(formData.get("id"));

  await prisma.trainingArticle.delete({ where: { id } });

  revalidatePath("/training-centre");
  revalidatePath("/training-centre/manage");
}
