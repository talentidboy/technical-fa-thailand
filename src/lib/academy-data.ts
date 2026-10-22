import { prisma } from "./prisma";
import { currentLicence, licenceState } from "./academy";
import { verifiedCoachLicence, type StaffForCheck, type TeamForCheck } from "./academy-checks";

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

// บุคลากร + ใบอนุญาตที่ยืนยันจากฐานข้อมูลผู้ฝึกสอน (เฉพาะฝั่งเซิร์ฟเวอร์ — ผู้เรียกต้องตรวจสิทธิ์เอง)
export async function loadStaff(academyId: number, now = new Date()) {
  const staff = await prisma.academyStaff.findMany({
    where: { academyId },
    include: { coach: { include: { licenseRecords: { select: { licenseType: true, expireDate: true } } } } },
    orderBy: { id: "asc" },
  });
  return staff.map((s) => ({ ...s, verifiedLicence: s.coach ? verifiedCoachLicence(s.coach.licenseRecords, now) : null }));
}

export async function loadTeams(academyId: number) {
  return prisma.academyTeam.findMany({
    where: { academyId },
    include: { players: { orderBy: [{ position: "asc" }, { shirtNo: "asc" }, { id: "asc" }] } },
    orderBy: [{ ageGroup: "asc" }, { id: "asc" }],
  });
}

// ข้อมูลสำหรับตรวจเกณฑ์อัตโนมัติ
export async function loadCheckData(academyId: number): Promise<{ staff: StaffForCheck[]; teams: TeamForCheck[] }> {
  const [staff, teams] = await Promise.all([loadStaff(academyId), loadTeams(academyId)]);
  return {
    staff: staff.map((s) => ({ name: s.name, role: s.role, licence: s.licence, verifiedLicence: s.verifiedLicence })),
    teams: teams.map((t) => ({ name: t.name, ageGroup: t.ageGroup, players: t.players.map((p) => ({ position: p.position })) })),
  };
}
