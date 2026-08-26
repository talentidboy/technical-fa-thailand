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

export async function createAnnouncement(formData: FormData) {
  const user = await requireAdminOrStaff();

  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const tag = String(formData.get("tag") ?? "").trim();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();

  if (!title || !excerpt) {
    throw new Error("กรุณากรอกหัวข้อและรายละเอียดย่อ");
  }

  const imageUrl = await saveUploadedPhoto(
    formData.get("image") as File | null,
  );

  await prisma.announcement.create({
    data: {
      title,
      excerpt,
      content: content || excerpt,
      imageUrl,
      tag: tag || null,
      linkUrl: linkUrl || null,
      authorId: user.id,
    },
  });

  revalidatePath("/announcements");
  revalidatePath("/");
}

export async function updateAnnouncement(formData: FormData) {
  await requireAdminOrStaff();
  const id = Number(formData.get("id"));

  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const tag = String(formData.get("tag") ?? "").trim();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();

  if (!title || !excerpt) {
    throw new Error("กรุณากรอกหัวข้อและรายละเอียดย่อ");
  }

  // อัปโหลดรูปใหม่เฉพาะตอนที่เลือกไฟล์จริงๆ — ถ้าเว้นว่างไว้ให้คงรูปเดิม ไม่ใช่ลบรูปทิ้ง
  const imageFile = formData.get("image") as File | null;
  const newImageUrl = imageFile && imageFile.size > 0 ? await saveUploadedPhoto(imageFile) : null;

  await prisma.announcement.update({
    where: { id },
    data: {
      title,
      excerpt,
      content: content || excerpt,
      tag: tag || null,
      linkUrl: linkUrl || null,
      ...(newImageUrl ? { imageUrl: newImageUrl } : {}),
    },
  });

  revalidatePath("/announcements");
  revalidatePath("/");
  revalidatePath(`/news/${id}`);
}

export async function deleteAnnouncement(formData: FormData) {
  await requireAdminOrStaff();
  const id = Number(formData.get("id"));

  await prisma.announcement.delete({ where: { id } });

  revalidatePath("/announcements");
  revalidatePath("/");
}
