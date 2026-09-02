"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSystemUser(formData: FormData) {
  await requireAdmin();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const roleRaw = String(formData.get("role") ?? "STAFF");
  // หน้านี้จัดการเฉพาะบัญชี Admin/เจ้าหน้าที่ — กันไว้อีกชั้นเผื่อมีการยิงฟอร์มที่ถูกแก้ไข values มา
  const role = roleRaw === "ADMIN" ? "ADMIN" : "STAFF";

  if (!email || password.length < 8) {
    redirect("/users?error=invalid_input");
  }

  const passwordHash = await hashPassword(password);
  await prisma.systemUser.create({
    data: { email, passwordHash, role, coachId: null },
  });

  revalidatePath("/users");
}

export async function deleteSystemUser(formData: FormData) {
  const currentAdmin = await requireAdmin();
  const id = Number(formData.get("id"));

  if (id === currentAdmin.id) {
    throw new Error("ไม่สามารถลบบัญชีของตัวเองได้");
  }

  // จำกัดขอบเขตไว้เฉพาะบัญชี Admin/เจ้าหน้าที่ — บัญชีผู้ฝึกสอนต้องลบผ่าน /coaches/accounts เท่านั้น
  await prisma.systemUser.deleteMany({ where: { id, role: { in: ["ADMIN", "STAFF"] } } });
  revalidatePath("/users");
}
