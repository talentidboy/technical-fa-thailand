"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { coachName } from "@/lib/coach-name";
import { searchCoachIds } from "@/lib/license-renewal-data";
import { previewMerge, mergeCoaches } from "@/lib/coach-merge";

export type MergeCandidate = { id: number; name: string; afcId: string | null; idTail: string | null; licenses: number; hasAccount: boolean };

// ค้นหาประวัติที่จะรวม (ชื่อ / AFC ID / เลขบัตร / รหัสในระบบ)
export async function searchMergeCandidates(coachId: number, q: string): Promise<MergeCandidate[]> {
  await requireAdmin();
  const text = q.trim();
  if (!text) return [];
  const ids = /^#?\d{1,7}$/.test(text) ? new Set([Number(text.replace("#", ""))]) : await searchCoachIds(text);
  if (!ids || ids.size === 0) return [];
  const rows = await prisma.coach.findMany({
    where: { id: { in: [...ids].filter((id) => id !== coachId).slice(0, 30) } },
    select: {
      id: true,
      nameTh: true,
      surnameTh: true,
      nameEn: true,
      familyNameEn: true,
      afcId: true,
      idNumber: true,
      systemUser: { select: { id: true } },
      _count: { select: { licenseRecords: true } },
    },
    take: 15,
  });
  return rows.map((c) => ({
    id: c.id,
    name: coachName(c),
    afcId: c.afcId,
    idTail: c.idNumber ? c.idNumber.replace(/\D/g, "").slice(-4) : null,
    licenses: c._count.licenseRecords,
    hasAccount: !!c.systemUser,
  }));
}

export async function getMergePreview(sourceId: number, targetId: number) {
  await requireAdmin();
  return previewMerge(sourceId, targetId);
}

// รวม source เข้า target แล้วลบ source — คืน id ของประวัติที่เก็บไว้
export async function mergeCoachAction(sourceId: number, targetId: number): Promise<{ ok: true; targetId: number } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  try {
    const result = await mergeCoaches(sourceId, targetId);
    await audit(admin.email, "COACH_MERGE", {
      coachId: targetId,
      summary: `รวมประวัติ #${sourceId} เข้ากับ #${targetId} (ย้ายใบอนุญาต ${result.removed.licenses.length} ใบ${result.filled.length ? `, เติมข้อมูล ${result.filled.join(", ")}` : ""})`,
      details: result,
    });
    revalidatePath(`/coaches/${targetId}`);
    revalidatePath("/coaches");
    revalidatePath("/reports");
    return { ok: true, targetId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "รวมประวัติไม่สำเร็จ" };
  }
}
