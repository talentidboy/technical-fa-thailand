"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function approveApplication(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));

  const application = await prisma.application.findUnique({
    where: { id },
    include: { courseSession: { include: { course: true } } },
  });
  if (!application || application.status !== "PENDING") return;

  await prisma.$transaction([
    prisma.application.update({
      where: { id },
      data: { status: "APPROVED", reviewedAt: new Date(), reviewedBy: admin.email },
    }),
    prisma.licenseRecord.create({
      data: {
        coachId: application.coachId,
        licenseType: application.courseSession.course.licenseType,
        recordType: "TRAINING",
        issueDate: new Date(),
        confirmedBy: admin.email,
      },
    }),
  ]);

  revalidatePath(`/course-sessions/${application.courseSessionId}`);
  revalidatePath("/course-sessions");
  revalidatePath(`/coaches/${application.coachId}`);
}

export async function rejectApplication(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));

  const application = await prisma.application.update({
    where: { id },
    data: { status: "REJECTED", reviewedAt: new Date(), reviewedBy: admin.email },
  });

  revalidatePath(`/course-sessions/${application.courseSessionId}`);
}
