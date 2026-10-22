"use server";

import { prisma } from "@/lib/prisma";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.systemUser.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?error=1");
  }
  if (user.role === "COACH") {
    redirect("/login?error=coach");
  }
  if (!user.isActive) {
    redirect("/login?error=disabled");
  }

  await prisma.systemUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id);
  // บัญชีอคาเดมีเข้าได้เฉพาะพอร์ทัลของตัวเอง
  redirect(user.role === "ACADEMY" ? "/academies/portal" : "/");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
