import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// TEST_DB_SCHEMA ใช้เฉพาะตอนรันชุดทดสอบ (npm run test:e2e) — ชี้ไปที่ schema ทดสอบที่แยกจากข้อมูลจริง
// บนเว็บจริงไม่ได้ตั้งค่านี้ จึงใช้ schema ปกติเสมอ
// max: จำนวนการเชื่อมต่อต่อเครื่อง — Vercel ขยายหลายเครื่องพร้อมกันตอนคนเข้าเยอะ ถ้าแต่ละเครื่องเปิดได้ 10 (ค่าเริ่มต้น)
// จะแย่งช่องของตัวกลาง Supabase (pooler) จนเต็มเร็ว → ตั้งไว้ 5 · idle 10 วินาทีแล้วคืนช่อง
const adapter = new PrismaPg(
  { connectionString: process.env.DATABASE_URL, max: 5, idleTimeoutMillis: 10_000 },
  process.env.TEST_DB_SCHEMA ? { schema: process.env.TEST_DB_SCHEMA } : undefined,
);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
