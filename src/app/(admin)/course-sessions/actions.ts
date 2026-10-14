"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CORE_LICENSE_PROGRESSION } from "@/lib/constants";
import { defaultCourseTitle } from "@/lib/course-workflow";

function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function optionalDate(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value ? new Date(value) : null;
}

function sessionFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const venue = optionalString(formData, "venue");
  if (!name) throw new Error("กรุณากรอกชื่อรุ่น");
  const applicationOpenDate = optionalDate(formData, "applicationOpenDate");
  const applicationDeadline = optionalDate(formData, "applicationDeadline");
  if (applicationOpenDate && applicationDeadline && applicationOpenDate > applicationDeadline) {
    throw new Error("วันเปิดรับสมัครต้องมาก่อนวันปิดรับสมัคร");
  }
  const startDate = optionalDate(formData, "startDate");
  const endDate = optionalDate(formData, "endDate");
  if (startDate && endDate && startDate > endDate) throw new Error("วันเริ่มอบรมต้องมาก่อนวันจบอบรม");
  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  return {
    name,
    venue,
    startDate,
    endDate,
    applicationOpenDate,
    applicationDeadline,
    capacity: capacityRaw ? Math.max(1, Number(capacityRaw)) : null,
  };
}

export type FormResult = { ok: true } | { ok: false; error: string } | null;

// เปิดรุ่นอบรมใหม่ในฟอร์มเดียว — เลือกระดับ (G/C/B/A/PRO) แล้วระบบสร้าง/ใช้หลักสูตรของระดับนั้นให้เอง
// course = "G" | "C" | ... | "course:<id>" (หลักสูตรทั่วไปเดิม) | "general:new" (หลักสูตรทั่วไปใหม่ ใช้ชื่อจาก generalTitle)
export async function openCourseSession(_prev: FormResult, formData: FormData): Promise<FormResult> {
  await requireAdmin();
  let sessionId: number;
  try {
    const choice = String(formData.get("course") ?? "");
    const fields = sessionFields(formData);

    let courseId: number;
    if (CORE_LICENSE_PROGRESSION.includes(choice)) {
      const course =
        (await prisma.course.findUnique({ where: { licenseType: choice } })) ??
        (await prisma.course.create({
          data: { courseType: "LICENSE", licenseType: choice, title: defaultCourseTitle(choice) },
        }));
      courseId = course.id;
    } else if (choice.startsWith("course:")) {
      courseId = Number(choice.slice(7));
    } else if (choice === "general:new") {
      const title = String(formData.get("generalTitle") ?? "").trim();
      if (!title) throw new Error("กรุณากรอกชื่อหลักสูตรอบรมทั่วไป");
      courseId = (await prisma.course.create({ data: { courseType: "GENERAL", title } })).id;
    } else {
      throw new Error("กรุณาเลือกหลักสูตร");
    }

    const requirement = optionalString(formData, "requirement");
    if (requirement) await prisma.course.update({ where: { id: courseId }, data: { requirement } });

    sessionId = (await prisma.courseSession.create({ data: { courseId, ...fields, status: "OPEN" } })).id;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "เปิดรุ่นไม่สำเร็จ" };
  }
  revalidatePath("/course-sessions");
  revalidatePath("/coach-center");
  redirect(`/course-sessions/${sessionId}?created=1`);
}

export async function updateCourseSession(_prev: FormResult, formData: FormData): Promise<FormResult> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  try {
    await prisma.courseSession.update({ where: { id }, data: sessionFields(formData) });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ" };
  }
  revalidatePath("/course-sessions");
  revalidatePath(`/course-sessions/${id}`);
  revalidatePath(`/apply/${id}`);
  return { ok: true };
}

export async function setCourseSessionStatus(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  if (!["OPEN", "CLOSED", "COMPLETED"].includes(status)) return;

  await prisma.courseSession.update({ where: { id }, data: { status } });
  revalidatePath("/course-sessions");
  revalidatePath(`/course-sessions/${id}`);
  revalidatePath(`/apply/${id}`);
  revalidatePath("/coach-center");
}

// ลบรุ่นได้เฉพาะรุ่นที่ยังไม่ได้ออกใบอนุญาตให้ใคร (กันประวัติใบอนุญาตหลุดจากรุ่น)
export async function deleteCourseSession(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const issued = await prisma.application.count({ where: { courseSessionId: id, licenseRecordId: { not: null } } });
  if (issued > 0) redirect(`/course-sessions/${id}?error=${encodeURIComponent("รุ่นนี้ออกใบอนุญาตไปแล้ว ลบไม่ได้")}`);
  await prisma.courseSession.delete({ where: { id } });
  revalidatePath("/course-sessions");
  revalidatePath("/coach-center");
  redirect("/course-sessions");
}
