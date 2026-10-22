import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// TEST_DB_SCHEMA ใช้เฉพาะตอนรันชุดทดสอบ (npm run test:e2e) — ชี้ไปที่ schema ทดสอบที่แยกจากข้อมูลจริง
// บนเว็บจริงไม่ได้ตั้งค่านี้ จึงใช้ schema ปกติเสมอ
const adapter = new PrismaPg(
  { connectionString: process.env.DATABASE_URL },
  process.env.TEST_DB_SCHEMA ? { schema: process.env.TEST_DB_SCHEMA } : undefined,
);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
