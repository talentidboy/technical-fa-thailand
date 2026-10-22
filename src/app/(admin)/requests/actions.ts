"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { notifyCoaches } from "@/lib/notify";

export async function approveProfileEditRequest(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));

  const request = await prisma.profileEditRequest.findUnique({
    where: { id },
  });
  if (!request || request.status !== "PENDING") return;

  const rawChanges = JSON.parse(request.payload) as Record<string, string>;
  const changes = Object.fromEntries(
    Object.entries(rawChanges).map(([key, value]) => [key, value || null]),
  );

  await prisma.$transaction([
    prisma.coach.update({
      where: { id: request.coachId },
      data: changes,
    }),
    prisma.profileEditRequest.update({
      where: { id },
      data: { status: "APPROVED", resolvedAt: new Date() },
    }),
  ]);

  await audit(admin.email, "PROFILE_REQUEST", { coachId: request.coachId, summary: `อนุมัติคำขอแก้ไข ${Object.keys(changes).join(", ")}`, details: changes });
  await notifyCoaches([{ coachId: request.coachId, type: "PROFILE_APPROVED", title: "คำขอแก้ไขข้อมูลได้รับอนุมัติแล้ว", href: "/me/settings" }]);
  revalidatePath("/requests");
  revalidatePath(`/coaches/${request.coachId}`);
}

export async function rejectProfileEditRequest(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));

  const request = await prisma.profileEditRequest.update({
    where: { id },
    data: { status: "REJECTED", resolvedAt: new Date() },
  });
  await audit(admin.email, "PROFILE_REQUEST", { coachId: request.coachId, summary: "ไม่อนุมัติคำขอแก้ไขข้อมูล" });
  await notifyCoaches([{ coachId: request.coachId, type: "PROFILE_REJECTED", title: "คำขอแก้ไขข้อมูลไม่ได้รับอนุมัติ", body: "ติดต่อเจ้าหน้าที่เพื่อสอบถามรายละเอียด", href: "/me/settings" }]);

  revalidatePath("/requests");
}
