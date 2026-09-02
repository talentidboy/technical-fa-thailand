"use server";

import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { generateOtp, hashOtp, verifyOtp } from "@/lib/otp";
import { isValidThaiIdNumber } from "@/lib/validation";
import { redirect } from "next/navigation";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 นาที
const RESEND_COOLDOWN_MS = 45 * 1000; // กันสแปมกดขอรหัสรัวๆ
const MAX_OTP_ATTEMPTS = 5;

function err(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

// ขั้นที่ 1: ตรวจข้อมูลทั้งหมด + หาโค้ชที่ตรงในระบบ แล้วส่ง OTP ไปยังอีเมล — ยังไม่สร้างบัญชีจริง
export async function requestRegistrationOtp(formData: FormData) {
  const nameTh = String(formData.get("nameTh") ?? "").trim();
  const surnameTh = String(formData.get("surnameTh") ?? "").trim();
  const idNumber = String(formData.get("idNumber") ?? "").trim();
  const afcId = String(formData.get("afcId") ?? "").trim();
  const telNo = String(formData.get("telNo") ?? "").trim();
  const dobRaw = String(formData.get("dob") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!nameTh || !surnameTh || !telNo || !dobRaw || !email || password.length < 8) {
    err("/register", "กรุณากรอกข้อมูลให้ครบทุกช่อง และรหัสผ่านอย่างน้อย 8 ตัวอักษร");
  }
  if (!idNumber && !afcId) {
    err("/register", "กรุณากรอกเลขบัตรประชาชนหรือ AFC ID อย่างน้อย 1 อย่าง เพื่อยืนยันตัวตนกับข้อมูลที่มีอยู่ในระบบ");
  }
  if (idNumber && !isValidThaiIdNumber(idNumber)) {
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
    where: {
      systemUser: null,
      OR: [idNumber ? { idNumber } : undefined, afcId ? { afcId } : undefined].filter(
        (c): c is { idNumber: string } | { afcId: string } => Boolean(c),
      ),
    },
  });
  if (!match) {
    err(
      "/register",
      "ไม่พบข้อมูลโค้ชที่ตรงกับเลขบัตรประชาชน/AFC ID นี้ในระบบ กรุณาติดต่อผู้ดูแลระบบให้นำเข้าข้อมูลก่อนสมัครสมาชิก",
    );
  }
  // ถ้าข้อมูลเบอร์โทร/วันเกิดมีอยู่แล้วในระบบ ต้องตรงกันเพื่อยืนยันตัวตนอีกชั้น (กันเดาแค่เลขบัตร/AFC ID มั่วๆ)
  if (match.telNo && match.telNo.replace(/\D/g, "") !== telNo.replace(/\D/g, "")) {
    err("/register", "เบอร์โทรศัพท์ไม่ตรงกับข้อมูลที่มีอยู่ในระบบ กรุณาตรวจสอบอีกครั้ง");
  }
  if (match.dob && match.dob.toISOString().slice(0, 10) !== dob.toISOString().slice(0, 10)) {
    err("/register", "วันเกิดไม่ตรงกับข้อมูลที่มีอยู่ในระบบ กรุณาตรวจสอบอีกครั้ง");
  }

  const existingOtp = await prisma.registrationOtp.findUnique({ where: { email } });
  if (existingOtp && existingOtp.createdAt.getTime() > Date.now() - RESEND_COOLDOWN_MS) {
    err("/register", "เพิ่งขอรหัสยืนยันไปเมื่อสักครู่ กรุณารอสักครู่แล้วลองใหม่");
  }

  const passwordHash = await hashPassword(password);
  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.registrationOtp.upsert({
    where: { email },
    create: {
      email,
      otpHash,
      coachId: match.id,
      nameTh,
      surnameTh,
      idNumber: idNumber || null,
      afcId: afcId || null,
      telNo,
      dob,
      passwordHash,
      expiresAt,
      attempts: 0,
    },
    update: {
      otpHash,
      coachId: match.id,
      nameTh,
      surnameTh,
      idNumber: idNumber || null,
      afcId: afcId || null,
      telNo,
      dob,
      passwordHash,
      expiresAt,
      attempts: 0,
      createdAt: new Date(),
    },
  });

  await sendOtpEmail(email, otp, "/register");
  redirect(`/register/verify?email=${encodeURIComponent(email)}`);
}

export async function resendRegistrationOtp(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const pending = await prisma.registrationOtp.findUnique({ where: { email } });
  if (!pending) {
    err("/register", "ไม่พบคำขอสมัครสมาชิกนี้ กรุณากรอกฟอร์มใหม่อีกครั้ง");
  }
  if (pending.createdAt.getTime() > Date.now() - RESEND_COOLDOWN_MS) {
    err(`/register/verify?email=${encodeURIComponent(email)}`, "เพิ่งขอรหัสยืนยันไปเมื่อสักครู่ กรุณารอสักครู่แล้วลองใหม่");
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  await prisma.registrationOtp.update({
    where: { email },
    data: { otpHash, expiresAt: new Date(Date.now() + OTP_TTL_MS), attempts: 0, createdAt: new Date() },
  });

  await sendOtpEmail(email, otp, `/register/verify?email=${encodeURIComponent(email)}`);
  redirect(`/register/verify?email=${encodeURIComponent(email)}&sent=1`);
}

// ขั้นที่ 2: ยืนยันรหัส OTP แล้วค่อยสร้างบัญชีจริง
export async function verifyRegistrationOtp(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const code = String(formData.get("code") ?? "").trim();
  const verifyPath = `/register/verify?email=${encodeURIComponent(email)}`;

  const pending = await prisma.registrationOtp.findUnique({ where: { email } });
  if (!pending) {
    err("/register", "ไม่พบคำขอสมัครสมาชิกนี้ กรุณากรอกฟอร์มใหม่อีกครั้ง");
  }
  if (pending.expiresAt.getTime() < Date.now()) {
    await prisma.registrationOtp.delete({ where: { email } });
    err("/register", "รหัสยืนยันหมดอายุแล้ว กรุณาสมัครสมาชิกใหม่อีกครั้ง");
  }
  if (pending.attempts >= MAX_OTP_ATTEMPTS) {
    await prisma.registrationOtp.delete({ where: { email } });
    err("/register", "กรอกรหัสผิดเกินจำนวนที่กำหนด กรุณาสมัครสมาชิกใหม่อีกครั้ง");
  }
  if (!verifyOtp(code, pending.otpHash)) {
    await prisma.registrationOtp.update({ where: { email }, data: { attempts: { increment: 1 } } });
    err(verifyPath, "รหัสยืนยันไม่ถูกต้อง กรุณาลองใหม่");
  }

  // เช็คซ้ำอีกครั้งตอนยืนยันจริง เผื่อมีคนอื่นแซงผูกบัญชีโค้ชคนนี้ไปแล้วระหว่างรอ OTP
  const coach = await prisma.coach.findUnique({ where: { id: pending.coachId }, select: { systemUser: true } });
  if (!coach || coach.systemUser) {
    await prisma.registrationOtp.delete({ where: { email } });
    err("/register", "ข้อมูลโค้ชนี้ถูกผูกกับบัญชีอื่นไปแล้ว กรุณาติดต่อผู้ดูแลระบบ");
  }

  const user = await prisma.$transaction(async (tx) => {
    await tx.coach.update({
      where: { id: pending.coachId },
      data: {
        telNo: pending.telNo,
        dob: pending.dob,
        email,
      },
    });
    const created = await tx.systemUser.create({
      data: { email, passwordHash: pending.passwordHash, role: "COACH", coachId: pending.coachId },
    });
    await tx.registrationOtp.delete({ where: { email } });
    return created;
  });

  await createSession(user.id);
  redirect("/me");
}

async function sendOtpEmail(email: string, otp: string, fallbackPath: string) {
  if (!isEmailConfigured()) {
    err(fallbackPath, "ระบบส่งอีเมลยืนยันยังไม่ได้ตั้งค่า กรุณาติดต่อผู้ดูแลระบบ");
  }
  try {
    await sendEmail({
      to: email,
      subject: `รหัสยืนยันการสมัครสมาชิก FA Thailand Technical: ${otp}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1a3a6b;">FA Thailand Technical</h2>
          <p>รหัสยืนยันการสมัครสมาชิกผู้ฝึกสอนของคุณคือ</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a3a6b;">${otp}</p>
          <p style="color: #64748b; font-size: 14px;">รหัสนี้จะหมดอายุใน 10 นาที หากคุณไม่ได้ทำรายการนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
        </div>
      `,
    });
  } catch {
    err(fallbackPath, "ส่งอีเมลยืนยันไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
  }
}
