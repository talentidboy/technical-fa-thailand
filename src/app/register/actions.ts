"use server";

import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { isValidThaiIdNumber } from "@/lib/validation";
import { redirect } from "next/navigation";

function err(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

// ตรวจข้อมูลทั้งหมด + หาโค้ชที่ตรงในระบบ แล้วสร้างบัญชีทันที (ไม่ต้องรอยืนยัน OTP ทางอีเมล)
export async function registerCoach(formData: FormData) {
  const nameTh = String(formData.get("nameTh") ?? "").trim();
  const surnameTh = String(formData.get("surnameTh") ?? "").trim();
  const idNumber = String(formData.get("idNumber") ?? "").trim();
  const telNo = String(formData.get("telNo") ?? "").trim();
  const dobRaw = String(formData.get("dob") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!nameTh || !surnameTh || !idNumber || !telNo || !dobRaw || !email || password.length < 8) {
    err("/register", "กรุณากรอกข้อมูลให้ครบทุกช่อง และรหัสผ่านอย่างน้อย 8 ตัวอักษร");
  }
  if (!isValidThaiIdNumber(idNumber)) {
    err("/register", "เลขบัตรประชาชนไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
  }
  const dob = new Date(dobRaw);
  if (Number.isNaN(dob.getTime())) {
    err("/register", "วันเกิดไม่ถูกต้อง");
  }

  const existingUser = await prisma.systemUser.findUnique({ where: { email } });
  if (existingUser) {
    err("/register", "อีเมลนี้มีผู้ใช้งานแล้ว");
  }

  // ต้องพบข้อมูลโค้ชที่มีอยู่จริงในระบบเท่านั้น (นำเข้าไว้ล่วงหน้าโดยเจ้าหน้าที่) — ไม่สร้างประวัติโค้ชใหม่จากฟอร์มสมัครอีกต่อไป
  const match = await prisma.coach.findFirst({
    where: { systemUser: null, idNumber },
  });
  if (!match) {
    err(
      "/register",
      "ไม่พบข้อมูลโค้ชที่ตรงกับเลขบัตรประชาชนนี้ในระบบ กรุณาติดต่อผู้ดูแลระบบให้นำเข้าข้อมูลก่อนสมัครสมาชิก",
    );
  }
  // ถ้าข้อมูลเบอร์โทร/วันเกิดมีอยู่แล้วในระบบ ต้องตรงกันเพื่อยืนยันตัวตนอีกชั้น (กันเดาแค่เลขบัตร/AFC ID มั่วๆ)
  if (match.telNo && match.telNo.replace(/\D/g, "") !== telNo.replace(/\D/g, "")) {
    err("/register", "เบอร์โทรศัพท์ไม่ตรงกับข้อมูลที่มีอยู่ในระบบ กรุณาตรวจสอบอีกครั้ง");
  }
  if (match.dob && match.dob.toISOString().slice(0, 10) !== dob.toISOString().slice(0, 10)) {
    err("/register", "วันเกิดไม่ตรงกับข้อมูลที่มีอยู่ในระบบ กรุณาตรวจสอบอีกครั้ง");
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    await tx.coach.update({
      where: { id: match.id },
      data: { telNo, dob, email },
    });
    return tx.systemUser.create({
      data: { email, passwordHash, role: "COACH", coachId: match.id },
    });
  });

  await createSession(user.id);
  redirect("/me");
}
