"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import type { FormResult } from "@/components/ResultForm";

const text = (fd: FormData, key: string) =>
  String(fd.get(key) ?? "")
    .replace(/\r\n?/g, "\n")
    .trim();
const optional = (fd: FormData, key: string) => text(fd, key) || null;

// เข้าสู่ระบบ: บัญชีอคาเดมี → พอร์ทัล · แอดมิน/เจ้าหน้าที่ → หน้าจัดการ
export async function academyLogin(formData: FormData) {
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await prisma.systemUser.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) redirect("/academies/login?error=1");
  if (!user.isActive) redirect("/academies/login?error=disabled");
  if (user.role === "COACH") redirect("/academies/login?error=coach");
  await prisma.systemUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id);
  redirect(user.role === "ACADEMY" ? "/academies/portal" : "/academies/manage");
}

export async function academyLogout() {
  await destroySession();
  redirect("/academies");
}

// สมัครบัญชีอคาเดมี — อคาเดมีใหม่: สร้างข้อมูลและเริ่มใช้งานได้ทันที · อคาเดมีในทะเบียน: ขอสิทธิ์ดูแล รอแอดมินอนุมัติ
export async function registerAcademy(formData: FormData): Promise<FormResult> {
  try {
    const email = text(formData, "email").toLowerCase();
    const password = String(formData.get("password") ?? "");
    const name = text(formData, "name");
    const mode = text(formData, "mode");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("อีเมลไม่ถูกต้อง");
    if (password.length < 8) throw new Error("รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร");
    if (password !== String(formData.get("password2") ?? "")) throw new Error("ยืนยันรหัสผ่านไม่ตรงกัน");
    if (!name) throw new Error("กรุณากรอกชื่อผู้ดูแลบัญชี");
    if (formData.get("consent") !== "on") throw new Error("กรุณายอมรับเงื่อนไขการใช้ข้อมูล");
    if (await prisma.systemUser.findUnique({ where: { email } })) throw new Error("อีเมลนี้มีบัญชีอยู่แล้ว — เข้าสู่ระบบแทน");

    let academyId: number;
    let isNew: boolean;
    if (mode === "existing") {
      academyId = Number(formData.get("academyId"));
      const found = Number.isInteger(academyId) && (await prisma.academy.findUnique({ where: { id: academyId }, select: { id: true } }));
      if (!found) throw new Error("กรุณาเลือกอคาเดมีจากรายการ");
      isNew = false;
    } else {
      const nameEn = text(formData, "nameEn");
      if (!nameEn) throw new Error("กรุณากรอกชื่ออคาเดมี (ภาษาอังกฤษ)");
      if (!text(formData, "province")) throw new Error("กรุณาเลือกจังหวัด");
      const academy = await prisma.academy.create({
        data: {
          nameEn,
          nameTh: optional(formData, "nameTh"),
          province: text(formData, "province"),
          address: optional(formData, "address"),
          parentClub: optional(formData, "parentClub"),
          contactName: name,
          phone: optional(formData, "phone"),
          email,
        },
      });
      academyId = academy.id;
      isNew = true;
    }

    const user = await prisma.systemUser.create({
      data: {
        email,
        role: "ACADEMY",
        passwordHash: await hashPassword(password),
        academyMember: {
          create: {
            academyId,
            name,
            phone: optional(formData, "phone"),
            position: optional(formData, "position"),
            note: optional(formData, "note"),
            status: isNew ? "APPROVED" : "PENDING",
          },
        },
      },
    });
    await audit(email, "ACADEMY_ACCOUNT", {
      summary: isNew ? `สมัครบัญชีพร้อมเพิ่มอคาเดมีใหม่` : `สมัครบัญชีและขอสิทธิ์ดูแลอคาเดมีในทะเบียน (รออนุมัติ)`,
      details: { academyId, userId: user.id, isNew },
    });
    await createSession(user.id);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "สมัครไม่สำเร็จ" };
  }
  redirect("/academies/portal");
}
