"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function done() {
  revalidatePath("/errors");
  revalidatePath("/dashboard");
}

// ทำเครื่องหมายว่าแก้แล้ว (ถ้าเกิดซ้ำหลังจากนี้ จะขึ้นเป็นรายการใหม่)
export async function resolveError(formData: FormData) {
  await requireAdmin();
  await prisma.errorLog.update({ where: { id: Number(formData.get("id")) }, data: { resolved: true } });
  done();
}

export async function resolveAllErrors() {
  await requireAdmin();
  await prisma.errorLog.updateMany({ where: { resolved: false }, data: { resolved: true } });
  done();
}

// ลบรายการที่แก้แล้วและเก่ากว่า 30 วัน
export async function purgeOldErrors() {
  await requireAdmin();
  await prisma.errorLog.deleteMany({ where: { resolved: true, lastSeenAt: { lt: new Date(Date.now() - 30 * 86_400_000) } } });
  done();
}
