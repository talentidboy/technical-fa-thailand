import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

const COOKIE_NAME = "session_token";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: number) {
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await prisma.session.create({ data: { sessionToken, userId, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { sessionToken: token } });
  }
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: { user: { include: { coach: true } } },
  });

  if (!session || session.expiresAt.getTime() < Date.now()) {
    return null;
  }

  // บัญชีที่ถูกระงับ (isActive = false) ให้ล็อกเอาต์ทันทีตั้งแต่ request ถัดไป ไม่ต้องรอ session หมดอายุ
  if (!session.user.isActive) {
    return null;
  }

  return session.user;
}

export type CurrentUser = NonNullable<
  Awaited<ReturnType<typeof getCurrentUser>>
>;

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("เฉพาะผู้ดูแลระบบเท่านั้นที่ทำรายการนี้ได้");
  }
  return user;
}

export async function requireCoach() {
  const user = await getCurrentUser();
  if (!user) redirect("/coach-center/login");
  if (user.role !== "COACH" || !user.coachId) {
    redirect("/dashboard");
  }
  return user;
}
