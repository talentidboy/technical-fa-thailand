"use server";

import { prisma } from "@/lib/prisma";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";
import { clearFailedLogins, loginLocked, recordFailedLogin } from "@/lib/login-guard";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (await loginLocked(email)) redirect("/login?error=locked");
  const user = await prisma.systemUser.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await recordFailedLogin(email);
    redirect("/login?error=1");
  }
  await clearFailedLogins(email);
  if (user.role === "COACH") {
    redirect("/login?error=coach");
  }
  if (!user.isActive) {
    redirect("/login?error=disabled");
  }

  await prisma.systemUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id);
  // บัญชีอคาเดมีเข้าได้เฉพาะพอร์ทัลของตัวเอง
  // แอดมิน/เจ้าหน้าที่ → ศูนย์ควบคุม (งานค้างทุกหมวด)
  redirect(user.role === "ACADEMY" ? "/academies/portal" : "/admin");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
