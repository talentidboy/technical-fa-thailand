"use server";

import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { clearFailedLogins, loginLocked, recordFailedLogin } from "@/lib/login-guard";
import { redirect } from "next/navigation";

export async function coachLogin(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (await loginLocked(email)) redirect("/coach-center/login?error=locked");
  const user = await prisma.systemUser.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await recordFailedLogin(email);
    redirect("/coach-center/login?error=1");
  }
  await clearFailedLogins(email);
  if (user.role !== "COACH") {
    redirect("/coach-center/login?error=staff");
  }
  if (!user.isActive) {
    redirect("/coach-center/login?error=disabled");
  }

  await prisma.systemUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id);
  redirect("/me");
}
