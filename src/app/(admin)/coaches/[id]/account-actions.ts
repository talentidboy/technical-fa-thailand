"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";

export type AccountResult =
  | { ok: true; message: string; username?: string; password?: string }
  | { ok: false; error: string };

// ตัวอักษรที่อ่านง่าย (ไม่มี 0/O, 1/l/I) — ให้โค้ชพิมพ์ตามได้ไม่ผิด
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
function randomPassword(length = 8) {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

// ชื่อผู้ใช้ = อีเมล หรือข้อความอื่นที่ไม่ซ้ำ (เช่น เลขบัตรประชาชน / เบอร์โทร) — เก็บเป็นตัวพิมพ์เล็ก
function normalizeUsername(raw: string) {
  const username = raw.trim().toLowerCase();
  if (username.length < 4) throw new Error("ชื่อผู้ใช้ต้องมีอย่างน้อย 4 ตัวอักษร");
  if (/\s/.test(username)) throw new Error("ชื่อผู้ใช้ห้ามมีช่องว่าง");
  return username;
}

function checkPassword(raw: string) {
  const password = raw.trim() || randomPassword();
  if (password.length < 8) throw new Error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร (หรือเว้นว่างให้ระบบสุ่มให้)");
  return password;
}

async function run(coachId: number, action: string, fn: () => Promise<AccountResult>): Promise<AccountResult> {
  const admin = await requireAdmin();
  try {
    const result = await fn();
    // ไม่เก็บรหัสผ่านในบันทึก
    if (result.ok) await audit(admin.email, action, { coachId, summary: `${result.message}${result.username ? ` (${result.username})` : ""}` });
    revalidatePath(`/coaches/${coachId}`);
    revalidatePath("/coaches/accounts");
    return result;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ" };
  }
}

async function ensureUsernameFree(username: string, exceptUserId?: number) {
  const taken = await prisma.systemUser.findUnique({ where: { email: username }, select: { id: true } });
  if (taken && taken.id !== exceptUserId) throw new Error("ชื่อผู้ใช้นี้มีคนใช้แล้ว");
}

export async function createCoachLogin(coachId: number, usernameRaw: string, passwordRaw: string) {
  return run(coachId, "ACCOUNT_CREATE", async () => {
    const username = normalizeUsername(usernameRaw);
    const password = checkPassword(passwordRaw);
    const coach = await prisma.coach.findUnique({ where: { id: coachId }, select: { systemUser: true } });
    if (!coach) throw new Error("ไม่พบผู้ฝึกสอน");
    if (coach.systemUser) throw new Error("ผู้ฝึกสอนคนนี้มีบัญชีอยู่แล้ว");
    await ensureUsernameFree(username);
    await prisma.systemUser.create({
      data: { coachId, email: username, passwordHash: await hashPassword(password), role: "COACH" },
    });
    return { ok: true, message: "สร้างบัญชีแล้ว", username, password };
  });
}

// ตั้งรหัสผ่านใหม่ + ออกจากระบบทุกอุปกรณ์ที่ล็อกอินค้างไว้
export async function resetCoachLogin(coachId: number, passwordRaw: string) {
  return run(coachId, "ACCOUNT_RESET", async () => {
    const password = checkPassword(passwordRaw);
    const user = await prisma.systemUser.findUnique({ where: { coachId } });
    if (!user) throw new Error("ยังไม่มีบัญชี");
    await prisma.$transaction([
      prisma.systemUser.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } }),
      prisma.session.deleteMany({ where: { userId: user.id } }),
    ]);
    return { ok: true, message: "ตั้งรหัสผ่านใหม่แล้ว", username: user.email, password };
  });
}

export async function renameCoachLogin(coachId: number, usernameRaw: string) {
  return run(coachId, "ACCOUNT_RENAME", async () => {
    const username = normalizeUsername(usernameRaw);
    const user = await prisma.systemUser.findUnique({ where: { coachId } });
    if (!user) throw new Error("ยังไม่มีบัญชี");
    await ensureUsernameFree(username, user.id);
    await prisma.systemUser.update({ where: { id: user.id }, data: { email: username } });
    return { ok: true, message: "เปลี่ยนชื่อผู้ใช้แล้ว", username };
  });
}

export async function toggleCoachLogin(coachId: number) {
  return run(coachId, "ACCOUNT_TOGGLE", async () => {
    const user = await prisma.systemUser.findUnique({ where: { coachId } });
    if (!user) throw new Error("ยังไม่มีบัญชี");
    await prisma.systemUser.update({ where: { id: user.id }, data: { isActive: !user.isActive } });
    return { ok: true, message: user.isActive ? "ระงับบัญชีแล้ว" : "เปิดใช้งานบัญชีแล้ว" };
  });
}
