"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { thaiYear } from "@/lib/training-report";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const minus543 = (d: Date) => {
  const x = new Date(d);
  x.setUTCFullYear(x.getUTCFullYear() - 543);
  return x;
};

// แก้ใบอนุญาตที่กรอกปีเป็น พ.ศ. (เช่น 2568) ให้เป็น ค.ศ. — ลบ 543 ปีจากวันที่ออกใบ (และวันหมดอายุถ้าเป็น พ.ศ. ด้วย)
export async function fixBuddhistYears(): Promise<ActionResult> {
  await requireAdmin();
  try {
    const records = await prisma.licenseRecord.findMany({
      where: { issueDate: { gte: new Date("2400-01-01T00:00:00Z") } },
      select: { id: true, coachId: true, issueDate: true, expireDate: true },
    });
    const fix = records.filter((r) => r.issueDate && thaiYear(r.issueDate) >= 2400);
    if (fix.length === 0) return { ok: true, message: "ไม่มีรายการที่ต้องแก้" };
    await prisma.$transaction(
      fix.map((r) =>
        prisma.licenseRecord.update({
          where: { id: r.id },
          data: {
            issueDate: minus543(r.issueDate!),
            ...(r.expireDate && thaiYear(r.expireDate) >= 2400 ? { expireDate: minus543(r.expireDate) } : {}),
          },
        }),
      ),
    );
    revalidatePath("/reports");
    for (const id of new Set(fix.map((r) => r.coachId))) revalidatePath(`/coaches/${id}`);
    return { ok: true, message: `แก้ปี พ.ศ. → ค.ศ. แล้ว ${fix.length} ใบ` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "แก้ไขไม่สำเร็จ" };
  }
}
