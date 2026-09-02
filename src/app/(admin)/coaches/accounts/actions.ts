"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function revalidate() {
  revalidatePath("/coaches/accounts");
}

export async function createCoachAccount(formData: FormData) {
  await requireAdmin();

  const coachId = Number(formData.get("coachId"));
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!coachId || !email || password.length < 8) {
    redirect("/coaches/accounts?error=invalid_input");
  }

  const coach = await prisma.coach.findUnique({ where: { id: coachId }, select: { systemUser: true } });
  if (!coach || coach.systemUser) {
    redirect("/coaches/accounts?error=coach_taken");
  }

  const passwordHash = await hashPassword(password);
  await prisma.systemUser.create({
    data: { coachId, email, passwordHash, role: "COACH" },
  });

  revalidate();
}

export async function resetCoachPassword(formData: FormData) {
  await requireAdmin();

  const coachId = Number(formData.get("coachId"));
  const newPassword = String(formData.get("newPassword") ?? "");

  if (!coachId || newPassword.length < 8) {
    redirect("/coaches/accounts?error=weak_password");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.systemUser.update({ where: { coachId }, data: { passwordHash } });

  revalidate();
}

export async function toggleCoachAccountActive(formData: FormData) {
  await requireAdmin();

  const coachId = Number(formData.get("coachId"));
  const user = await prisma.systemUser.findUnique({ where: { coachId }, select: { isActive: true } });
  if (!user) return;

  await prisma.systemUser.update({ where: { coachId }, data: { isActive: !user.isActive } });
  revalidate();
}

// ยังไม่ได้ตั้งค่าระบบส่งอีเมล (ไม่มี Resend/SMTP ผูกไว้ในโปรเจกต์นี้เลย) — ไม่ส่งอะไรจริง
// แค่ redirect กลับพร้อมข้อความแจ้งให้ชัดเจน กันสับสนว่า "ส่งแล้ว" ทั้งที่ไม่ได้ส่งจริง
export async function sendCoachAccountEmail(formData: FormData) {
  await requireAdmin();
  void formData.get("coachId");
  redirect("/coaches/accounts?error=email_not_configured");
}

export async function deleteCoachAccount(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));

  // จำกัดขอบเขตไว้เฉพาะบัญชีที่ role = COACH เท่านั้น กันไม่ให้ลบบัญชี Admin/เจ้าหน้าที่ผิดที่มาผิดทาง
  await prisma.systemUser.deleteMany({ where: { id, role: "COACH" } });
  revalidate();
}
