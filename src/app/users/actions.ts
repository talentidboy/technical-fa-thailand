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
  const role = String(formData.get("role") ?? "STAFF");
  const coachIdRaw = String(formData.get("coachId") ?? "").trim();

  if (!email || password.length < 8) {
    redirect("/users?error=invalid_input");
  }
  if (role === "COACH" && !coachIdRaw) {
    redirect("/users?error=must_select_coach");
  }

  const passwordHash = await hashPassword(password);
  await prisma.systemUser.create({
    data: {
      email,
      passwordHash,
      role,
      coachId: role === "COACH" ? Number(coachIdRaw) : null,
    },
  });

  revalidatePath("/users");
}

export async function deleteSystemUser(formData: FormData) {
  const currentAdmin = await requireAdmin();
  const id = Number(formData.get("id"));

  if (id === currentAdmin.id) {
    throw new Error("ไม่สามารถลบบัญชีของตัวเองได้");
  }

  await prisma.systemUser.delete({ where: { id } });
  revalidatePath("/users");
}
