import { headers } from "next/headers";
import { prisma } from "./prisma";

// จำกัดการเดารหัสผ่าน: ภายใน 15 นาที ผิดได้ไม่เกิน 8 ครั้งต่ออีเมล และ 40 ครั้งต่อ IP (กันการไล่เดาหลายบัญชีจากเครื่องเดียว)
// เก็บในฐานข้อมูล (ไม่ใช่หน่วยความจำ) เพราะ Vercel รันหลายเครื่องพร้อมกัน
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL = 8;
const MAX_PER_IP = 40;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || null;
}

// true = ถูกพักการเข้าสู่ระบบชั่วคราว (ยังไม่ต้องตรวจรหัสผ่าน)
export async function loginLocked(email: string) {
  const since = new Date(Date.now() - WINDOW_MS);
  const ip = await clientIp();
  const [byEmail, byIp] = await Promise.all([
    prisma.loginAttempt.count({ where: { email, createdAt: { gte: since } } }),
    ip ? prisma.loginAttempt.count({ where: { ip, createdAt: { gte: since } } }) : Promise.resolve(0),
  ]);
  return byEmail >= MAX_PER_EMAIL || byIp >= MAX_PER_IP;
}

export async function recordFailedLogin(email: string) {
  await prisma.loginAttempt.create({ data: { email, ip: await clientIp() } });
}

// เข้าสู่ระบบสำเร็จ → ล้างประวัติผิดของอีเมลนี้
export async function clearFailedLogins(email: string) {
  await prisma.loginAttempt.deleteMany({ where: { email } });
}

export const LOCKED_MESSAGE = "ใส่รหัสผ่านผิดหลายครั้งเกินไป — เพื่อความปลอดภัย กรุณาลองใหม่อีกครั้งในอีก 15 นาที";
