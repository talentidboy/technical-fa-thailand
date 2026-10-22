"use server";

import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ทำเครื่องหมายว่าอ่านแล้วทั้งหมด (เรียกเมื่อเปิดหน้าการแจ้งเตือน)
export async function markAllNotificationsRead() {
  const user = await requireCoach();
  await prisma.notification.updateMany({ where: { coachId: user.coachId!, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/me", "layout");
}
