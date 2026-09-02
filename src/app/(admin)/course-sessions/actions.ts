"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function optionalDate(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value ? new Date(value) : null;
}

export async function createCourse(formData: FormData) {
  await requireAdmin();

  const courseTypeRaw = String(formData.get("courseType") ?? "LICENSE").trim();
  const courseType = courseTypeRaw === "GENERAL" ? "GENERAL" : "LICENSE";
  const title = String(formData.get("title") ?? "").trim();
  const licenseType = courseType === "LICENSE" ? String(formData.get("licenseType") ?? "").trim() : null;

  if (!title) {
    throw new Error("กรุณากรอกชื่อหลักสูตร");
  }
  if (courseType === "LICENSE" && !licenseType) {
    throw new Error("กรุณาเลือกระดับใบอนุญาต");
  }

  await prisma.course.create({
    data: {
      courseType,
      licenseType,
      title,
      description: optionalString(formData, "description"),
      requirement: optionalString(formData, "requirement"),
    },
  });

  revalidatePath("/course-sessions");
}

export async function createCourseSession(formData: FormData) {
  await requireAdmin();

  const courseId = Number(formData.get("courseId"));
  const name = String(formData.get("name") ?? "").trim();
  const venue = optionalString(formData, "venue");
  if (!courseId || !name || !venue) {
    throw new Error("กรุณาเลือกหลักสูตร กรอกชื่อรุ่น และสถานที่จัดอบรม");
  }

  const applicationOpenDate = optionalDate(formData, "applicationOpenDate");
  const applicationDeadline = optionalDate(formData, "applicationDeadline");
  if (
    applicationOpenDate &&
    applicationDeadline &&
    applicationOpenDate > applicationDeadline
  ) {
    throw new Error("วันเปิดรับสมัครต้องมาก่อนวันปิดรับสมัคร");
  }

  const capacityRaw = String(formData.get("capacity") ?? "").trim();

  await prisma.courseSession.create({
    data: {
      courseId,
      name,
      venue,
      startDate: optionalDate(formData, "startDate"),
      endDate: optionalDate(formData, "endDate"),
      applicationOpenDate,
      applicationDeadline,
      capacity: capacityRaw ? Number(capacityRaw) : null,
    },
  });

  revalidatePath("/course-sessions");
}

export async function setCourseSessionStatus(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  if (!["OPEN", "CLOSED", "COMPLETED"].includes(status)) return;

  await prisma.courseSession.update({ where: { id }, data: { status } });
  revalidatePath("/course-sessions");
}
