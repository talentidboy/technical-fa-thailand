"use server";

import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function register(formData: FormData) {
  const nameTh = String(formData.get("nameTh") ?? "").trim();
  const surnameTh = String(formData.get("surnameTh") ?? "").trim();
  const idNumber = String(formData.get("idNumber") ?? "").trim();
  const afcId = String(formData.get("afcId") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!nameTh || !surnameTh || !email || password.length < 8) {
    redirect(
      "/register?error=" +
        encodeURIComponent("กรุณากรอกชื่อ-นามสกุล อีเมล และรหัสผ่านอย่างน้อย 8 ตัวอักษร"),
    );
  }

  const existingUser = await prisma.systemUser.findUnique({ where: { email } });
  if (existingUser) {
    redirect("/register?error=" + encodeURIComponent("อีเมลนี้มีผู้ใช้งานแล้ว"));
  }

  // ค้นหาโค้ชที่มีข้อมูลอยู่แล้วในระบบ (เช่น นำเข้าจาก Excel) แต่ยังไม่มีบัญชีผูกไว้
  let coachId: number | null = null;
  if (idNumber || afcId) {
    const match = await prisma.coach.findFirst({
      where: {
        systemUser: null,
        OR: [
          idNumber ? { idNumber } : undefined,
          afcId ? { afcId } : undefined,
        ].filter((c): c is { idNumber: string } | { afcId: string } => Boolean(c)),
      },
    });
    if (match) coachId = match.id;
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    let linkCoachId = coachId;
    if (!linkCoachId) {
      const newCoach = await tx.coach.create({
        data: {
          nameTh,
          surnameTh,
          idNumber: idNumber || null,
          afcId: afcId || null,
          email,
        },
      });
      linkCoachId = newCoach.id;
    }
    return tx.systemUser.create({
      data: { email, passwordHash, role: "COACH", coachId: linkCoachId },
    });
  });

  await createSession(user.id);
  redirect("/me");
}
