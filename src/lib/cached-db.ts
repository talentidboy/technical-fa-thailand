import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

// ตัวอ่านฐานข้อมูลแบบเก็บผลไว้ใช้ซ้ำ (สำหรับหน้าสาธารณะที่คนเข้าเยอะ เช่น หน้าแรก / G15 ช่วงแข่งสด)
// ใช้เหมือน prisma ทุกอย่าง (เช่น g15Db.g15Match.findMany(...)) แต่ผลที่ได้ถูกเก็บไว้ `revalidate` วินาที
// คนดูพันคนพร้อมกัน → ฐานข้อมูลถูกถามแค่ครั้งเดียวต่อช่วงเวลา แทนที่จะเป็นพันครั้ง
// · อ่านได้อย่างเดียว (find/count/groupBy/aggregate) — การเขียนต้องใช้ prisma ตรง
// · แอดมินแก้ข้อมูล → เรียก updateTag(<tag>) ใน Server Action แล้วหน้าจะได้ข้อมูลใหม่ทันที (ไม่ต้องรอหมดเวลา)
// · ผลถูกเก็บเป็น JSON — วันที่ (Date) ถูกแปลงกลับเป็น Date ให้อัตโนมัติ
// · อย่าใส่ค่าที่เปลี่ยนทุกครั้งในเงื่อนไข (เช่น new Date() ถึงมิลลิวินาที) เพราะจะกลายเป็นคนละรายการ ไม่ได้ใช้ซ้ำ — ปัดเป็นนาทีก่อน

const READS = new Set(["findMany", "findFirst", "findUnique", "findFirstOrThrow", "findUniqueOrThrow", "count", "groupBy", "aggregate"]);

function pack(value: unknown) {
  return JSON.stringify(value, function (this: Record<string, unknown>, key, v) {
    const raw = this[key];
    return raw instanceof Date ? { $date: raw.getTime() } : v;
  });
}

function unpack(text: string) {
  return JSON.parse(text, (_k, v) => (v && typeof v === "object" && Object.keys(v).length === 1 && typeof v.$date === "number" ? new Date(v.$date) : v));
}

export function cachedDb(tag: string, revalidate: number): typeof prisma {
  // ชุดทดสอบเขียนข้อมูลตรงลงฐานข้อมูลแล้วเปิดหน้าดูทันที — ไม่เก็บผลซ้ำ ไม่งั้นจะเห็นข้อมูลเก่า
  if (process.env.TEST_DB_SCHEMA) return prisma;
  return new Proxy({} as typeof prisma, {
    get(_t, model: string) {
      return new Proxy(
        {},
        {
          get(_m, method: string) {
            if (!READS.has(method)) throw new Error(`cachedDb อ่านได้อย่างเดียว — ${model}.${method} ต้องใช้ prisma ตรง`);
            return async (args?: unknown) => {
              const run = unstable_cache(
                async () => pack(await (prisma as unknown as Record<string, Record<string, (a?: unknown) => Promise<unknown>>>)[model][method](args)),
                [tag, model, method, pack(args ?? null)],
                { revalidate, tags: [tag] },
              );
              return unpack(await run());
            };
          },
        },
      );
    },
  });
}

// เวลาปัจจุบันปัดลงเป็นนาที — ใช้ในเงื่อนไขที่อ่านผ่าน cachedDb ให้ผลซ้ำได้ทั้งนาที
export const minuteNow = () => new Date(Math.floor(Date.now() / 60_000) * 60_000);

// ข้อมูลการแข่งขัน G15 — เก็บ 30 วินาที (แอดมินบันทึกผล → updateTag("g15") หน้าคนดูได้ผลใหม่ทันที)
export const g15Db = cachedDb("g15", 30);
// ข้อมูลหน้าสาธารณะทั่วไป (หน้าแรก ข่าว ทำเนียบ) — เก็บ 60 วินาที
export const publicDb = cachedDb("public", 60);
