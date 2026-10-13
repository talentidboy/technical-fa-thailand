"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireCoach, hashPassword, verifyPassword } from "@/lib/auth";

export type PasswordState = { ok: boolean; message: string } | null;

// เปลี่ยนรหัสผ่านของผู้ฝึกสอนเอง — ต้องยืนยันรหัสผ่านปัจจุบัน
// เปลี่ยนสำเร็จแล้วออกจากระบบอุปกรณ์อื่นทั้งหมด (เครื่องนี้ยังใช้งานต่อได้)
export async function changeMyPassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const user = await requireCoach();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!current || !next || !confirm) return { ok: false, message: "กรุณากรอกให้ครบทุกช่อง" };
  if (next.length < 8) return { ok: false, message: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" };
  if (next !== confirm) return { ok: false, message: "รหัสผ่านใหม่และการยืนยันไม่ตรงกัน" };
  if (next === current) return { ok: false, message: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม" };

  const account = await prisma.systemUser.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!account || !(await verifyPassword(current, account.passwordHash))) {
    return { ok: false, message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
  }

  const token = (await cookies()).get("session_token")?.value ?? "";
  await prisma.$transaction([
    prisma.systemUser.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } }),
    prisma.session.deleteMany({ where: { userId: user.id, NOT: { sessionToken: token } } }),
  ]);

  return { ok: true, message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว — อุปกรณ์อื่นที่เคยเข้าสู่ระบบไว้จะต้องเข้าสู่ระบบใหม่" };
}
