import { prisma } from "./prisma";
import { currentLicence, licenceState } from "./academy";

// อคาเดมีทั้งหมด + ใบปัจจุบัน + สถานะ (ข้อมูลหลักร้อยแถว คำนวณ/กรองในโค้ดได้สบาย)
export async function loadAcademies(now = new Date()) {
  const rows = await prisma.academy.findMany({ include: { licences: true }, orderBy: { id: "asc" } });
  return rows.map((a) => {
    const current = currentLicence(a.licences);
    return { ...a, current, level: current?.level ?? null, state: licenceState(current, now) };
  });
}

export type AcademyRow = Awaited<ReturnType<typeof loadAcademies>>[number];

export const matchesQuery = (a: { nameEn: string; nameTh: string | null; aliases: string | null }, q: string) =>
  !q || [a.nameEn, a.nameTh, a.aliases].some((v) => v?.toLowerCase().includes(q.toLowerCase()));
