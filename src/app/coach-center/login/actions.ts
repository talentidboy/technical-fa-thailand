"use server";

import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function coachLogin(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.systemUser.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/coach-center/login?error=1");
  }
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
