"use server";

import { coachName } from "@/lib/coach-name";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function revalidate() {
  revalidatePath("/coaches/accounts");
}

export async function createCoachAccount(formData: FormData) {
  const admin = await requireAdmin();

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
  await audit(admin.email, "ACCOUNT_CREATE", { coachId, summary: `สร้างบัญชี (${email})` });

  revalidate();
}

export async function resetCoachPassword(formData: FormData) {
  const admin = await requireAdmin();

  const coachId = Number(formData.get("coachId"));
  const newPassword = String(formData.get("newPassword") ?? "");

  if (!coachId || newPassword.length < 8) {
    redirect("/coaches/accounts?error=weak_password");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.systemUser.update({ where: { coachId }, data: { passwordHash } });
  await audit(admin.email, "ACCOUNT_RESET", { coachId, summary: "ตั้งรหัสผ่านใหม่" });

  revalidate();
}

export async function toggleCoachAccountActive(formData: FormData) {
  const admin = await requireAdmin();

  const coachId = Number(formData.get("coachId"));
  const user = await prisma.systemUser.findUnique({ where: { coachId }, select: { isActive: true } });
  if (!user) return;

  await prisma.systemUser.update({ where: { coachId }, data: { isActive: !user.isActive } });
  await audit(admin.email, "ACCOUNT_TOGGLE", { coachId, summary: user.isActive ? "ระงับบัญชี" : "เปิดใช้งานบัญชี" });
  revalidate();
}

export async function sendCoachAccountEmail(formData: FormData) {
  await requireAdmin();
  const coachId = Number(formData.get("coachId"));

  if (!isEmailConfigured()) {
    redirect("/coaches/accounts?error=email_not_configured");
  }

  const account = await prisma.systemUser.findUnique({
    where: { coachId },
    include: { coach: { select: { nameTh: true, surnameTh: true, nameEn: true, familyNameEn: true } } },
  });
  if (!account) redirect("/coaches/accounts?error=coach_not_found");

  try {
    await sendEmail({
      to: account.email,
      subject: "บัญชีผู้ฝึกสอนของคุณพร้อมใช้งานแล้ว — FA Thailand Technical",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1a3a6b;">FA Thailand Technical</h2>
          <p>สวัสดีคุณ${account.coach ? coachName(account.coach) : ""}</p>
          <p>บัญชีผู้ฝึกสอนของคุณพร้อมใช้งานแล้ว เข้าสู่ระบบได้ด้วยอีเมลนี้ (${account.email}) ที่หน้าเข้าสู่ระบบของเว็บไซต์
          หากลืมรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบเพื่อขอตั้งรหัสผ่านใหม่</p>
        </div>
      `,
    });
  } catch {
    redirect("/coaches/accounts?error=email_send_failed");
  }

  revalidate();
  redirect("/coaches/accounts?sent=1");
}

export async function deleteCoachAccount(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  const account = await prisma.systemUser.findFirst({ where: { id, role: "COACH" }, select: { email: true, coachId: true } });
  if (account) await audit(admin.email, "ACCOUNT_DELETE", { coachId: account.coachId, summary: `ลบบัญชี (${account.email})` });

  // จำกัดขอบเขตไว้เฉพาะบัญชีที่ role = COACH เท่านั้น กันไม่ให้ลบบัญชี Admin/เจ้าหน้าที่ผิดที่มาผิดทาง
  await prisma.systemUser.deleteMany({ where: { id, role: "COACH" } });
  revalidate();
}
