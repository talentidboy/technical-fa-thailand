"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdminOrStaff() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    throw new Error("เฉพาะผู้ดูแลระบบและเจ้าหน้าที่เท่านั้นที่ทำรายการนี้ได้");
  }
  return user;
}

function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export async function createEvent(formData: FormData) {
  await requireAdminOrStaff();

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const teamScope = String(formData.get("teamScope") ?? "").trim();
  const startDateRaw = String(formData.get("startDate") ?? "").trim();
  const endDateRaw = String(formData.get("endDate") ?? "").trim();

  if (!title || !category || !teamScope || !startDateRaw) {
    throw new Error("กรุณากรอกชื่อกิจกรรม หมวดหมู่ กลุ่มทีม และวันเริ่ม");
  }

  const startDate = new Date(startDateRaw);
  const endDate = endDateRaw ? new Date(endDateRaw) : startDate;
  if (endDate < startDate) {
    throw new Error("วันจบต้องไม่มาก่อนวันเริ่ม");
  }

  await prisma.event.create({
    data: {
      title,
      category,
      color: color || "#94a3b8",
      teamScope,
      startDate,
      endDate,
      sourceUrl: optionalString(formData, "sourceUrl"),
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function updateEvent(formData: FormData) {
  await requireAdminOrStaff();

  const id = Number(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const teamScope = String(formData.get("teamScope") ?? "").trim();
  const startDateRaw = String(formData.get("startDate") ?? "").trim();
  const endDateRaw = String(formData.get("endDate") ?? "").trim();

  if (!id || !title || !category || !teamScope || !startDateRaw) {
    throw new Error("กรุณากรอกชื่อกิจกรรม หมวดหมู่ กลุ่มทีม และวันเริ่ม");
  }

  const startDate = new Date(startDateRaw);
  const endDate = endDateRaw ? new Date(endDateRaw) : startDate;
  if (endDate < startDate) {
    throw new Error("วันจบต้องไม่มาก่อนวันเริ่ม");
  }

  await prisma.event.update({
    where: { id },
    data: {
      title,
      category,
      color: color || "#94a3b8",
      teamScope,
      startDate,
      endDate,
      sourceUrl: optionalString(formData, "sourceUrl"),
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function deleteEvent(formData: FormData) {
  await requireAdminOrStaff();
  const id = Number(formData.get("id"));

  await prisma.event.delete({ where: { id } });

  revalidatePath("/calendar");
  revalidatePath("/");
}

// เปลี่ยนชื่อหมวดหมู่/กลุ่มทีม — อัปเดตกิจกรรมทุกรายการที่ใช้ค่าเดิมให้เป็นค่าใหม่
export async function renameEventCategory(oldValue: string, newValue: string) {
  await requireAdminOrStaff();
  const from = oldValue.trim();
  const to = newValue.trim();
  if (!from || !to || from === to) return;

  await prisma.event.updateMany({ where: { category: from }, data: { category: to } });

  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function renameEventTeamScope(oldValue: string, newValue: string) {
  await requireAdminOrStaff();
  const from = oldValue.trim();
  const to = newValue.trim();
  if (!from || !to || from === to) return;

  await prisma.event.updateMany({ where: { teamScope: from }, data: { teamScope: to } });

  revalidatePath("/calendar");
  revalidatePath("/");
}

// เปลี่ยนสีของทุกกิจกรรมที่อยู่ในหมวดหมู่นี้ (ให้สีตรงกันทั้งหมวดหมู่)
export async function updateCategoryColor(category: string, color: string) {
  await requireAdminOrStaff();
  const cat = category.trim();
  const col = color.trim();
  if (!cat || !col) return;

  await prisma.event.updateMany({ where: { category: cat }, data: { color: col } });

  revalidatePath("/calendar");
  revalidatePath("/");
}
