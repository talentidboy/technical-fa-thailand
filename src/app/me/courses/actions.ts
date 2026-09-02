"use server";

import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/auth";
import { getHighestCoreLevel, getNextCoreLevel } from "@/lib/license-rank";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function applyToSession(formData: FormData) {
  const user = await requireCoach();
  const coachId = user.coachId!;
  const courseSessionId = Number(formData.get("courseSessionId"));

  const session = await prisma.courseSession.findUnique({
    where: { id: courseSessionId },
    include: { course: true, _count: { select: { applications: true } } },
  });
  if (!session || session.status !== "OPEN") {
    redirect("/me/courses?error=" + encodeURIComponent("รุ่นอบรมนี้ไม่เปิดรับสมัครแล้ว"));
  }
  if (session.applicationOpenDate && session.applicationOpenDate > new Date()) {
    redirect("/me/courses?error=" + encodeURIComponent("ยังไม่เปิดรับสมัคร"));
  }
  if (session.applicationDeadline && session.applicationDeadline < new Date()) {
    redirect("/me/courses?error=" + encodeURIComponent("หมดเขตรับสมัครแล้ว"));
  }
  if (session.capacity != null && session._count.applications >= session.capacity) {
    redirect("/me/courses?error=" + encodeURIComponent("รุ่นอบรมนี้เต็มแล้ว"));
  }

  // หลักสูตรอบรมทั่วไป (GENERAL) เปิดรับทุกระดับ ไม่ต้องตรวจสอบลำดับขั้นใบอนุญาต
  if (session.course.courseType !== "GENERAL") {
    const licenseRecords = await prisma.licenseRecord.findMany({
      where: { coachId },
      select: { licenseType: true, expireDate: true, issueDate: true },
    });
    const nextLevel = getNextCoreLevel(getHighestCoreLevel(licenseRecords));
    if (session.course.licenseType !== nextLevel) {
      redirect(
        "/me/courses?error=" +
          encodeURIComponent("คุณยังไม่มีคุณสมบัติสมัครหลักสูตรนี้ ต้องเรียงตามลำดับขั้น"),
      );
    }
  }

  const existing = await prisma.application.findUnique({
    where: { coachId_courseSessionId: { coachId, courseSessionId } },
  });
  if (existing && existing.status !== "REJECTED" && existing.status !== "CANCELLED") {
    redirect("/me/courses?error=" + encodeURIComponent("คุณสมัครรุ่นนี้ไปแล้ว"));
  }

  if (existing) {
    await prisma.application.update({
      where: { id: existing.id },
      data: { status: "PENDING", appliedAt: new Date(), reviewedAt: null, reviewedBy: null },
    });
  } else {
    await prisma.application.create({
      data: { coachId, courseSessionId, status: "PENDING" },
    });
  }

  revalidatePath("/me/courses");
  redirect("/me/courses?applied=1");
}
