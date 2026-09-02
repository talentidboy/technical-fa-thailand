"use server";

import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const EDITABLE_FIELDS = [
  "email",
  "telNo",
  "nationalityCode",
  "provinceCode",
  "districtCode",
  "subdistrictCode",
] as const;

export async function requestProfileEdit(formData: FormData) {
  const user = await requireCoach();
  const coachId = user.coachId!;

  const coach = await prisma.coach.findUnique({ where: { id: coachId } });
  if (!coach) throw new Error("ไม่พบข้อมูลผู้ฝึกสอน");

  const message = String(formData.get("message") ?? "").trim();
  const changes: Record<string, string> = {};

  for (const field of EDITABLE_FIELDS) {
    const value = String(formData.get(field) ?? "").trim();
    if (value !== (coach[field] ?? "")) {
      changes[field] = value;
    }
  }

  if (Object.keys(changes).length === 0 && !message) {
    throw new Error("ไม่มีการเปลี่ยนแปลงข้อมูล");
  }

  await prisma.profileEditRequest.create({
    data: {
      coachId,
      payload: JSON.stringify(changes),
      message: message || null,
    },
  });

  revalidatePath("/me");
}
