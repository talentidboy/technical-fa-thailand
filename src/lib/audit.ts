import { prisma } from "./prisma";
import type { Prisma } from "@/generated/prisma/client";
export { AUDIT_ACTIONS } from "./audit-actions";

// บันทึกการแก้ไขของแอดมิน/เจ้าหน้าที่ — เรียกหลังทำรายการสำเร็จ
// การบันทึกล้มเหลวต้องไม่ทำให้รายการที่ทำไปแล้วล้มตาม (จึงไม่โยน error ต่อ)
export async function audit(
  actorEmail: string,
  action: string,
  opts: { coachId?: number | null; summary: string; details?: unknown },
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorEmail,
        action,
        coachId: opts.coachId ?? null,
        summary: opts.summary.slice(0, 500),
        // แปลงเป็น JSON ล้วน (Date → string) ก่อนเก็บ
        details: opts.details === undefined ? undefined : (JSON.parse(JSON.stringify(opts.details)) as Prisma.InputJsonValue),
      },
    });
  } catch (err) {
    console.error("[audit] บันทึกไม่สำเร็จ", action, err);
  }
}

// เปรียบเทียบค่าก่อน/หลัง เฉพาะช่องที่เปลี่ยน → { ช่อง: [เดิม, ใหม่] }
export function changedFields(before: Record<string, unknown>, after: Record<string, unknown>) {
  const norm = (v: unknown) => (v instanceof Date ? v.toISOString() : v ?? null);
  const out: Record<string, [unknown, unknown]> = {};
  for (const key of Object.keys(after)) {
    if (JSON.stringify(norm(before[key])) !== JSON.stringify(norm(after[key]))) out[key] = [norm(before[key]), norm(after[key])];
  }
  return out;
}
