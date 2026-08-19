"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function approveProfileEditRequest(formData: FormData) {
  await requireAdmin();
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

  revalidatePath("/requests");
  revalidatePath(`/coaches/${request.coachId}`);
}

export async function rejectProfileEditRequest(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));

  await prisma.profileEditRequest.update({
    where: { id },
    data: { status: "REJECTED", resolvedAt: new Date() },
  });

  revalidatePath("/requests");
}
