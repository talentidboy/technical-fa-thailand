"use server";

import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function createFirstAdmin(formData: FormData) {
  const userCount = await prisma.systemUser.count();
  if (userCount > 0) {
    redirect("/login");
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 8) {
    throw new Error("กรุณากรอกอีเมลและรหัสผ่านอย่างน้อย 8 ตัวอักษร");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.systemUser.create({
    data: { email, passwordHash, role: "ADMIN" },
  });

  await createSession(user.id);
  redirect("/");
}
