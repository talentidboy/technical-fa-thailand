// ตรวจเกณฑ์ที่นับได้จากข้อมูลในระบบให้อัตโนมัติ (บุคลากร / ทีม / นักเตะ) — ใช้ประกอบการตรวจของแอดมิน ไม่ได้ตัดสินแทน
import type { AcademyLevel } from "./academy";

export const STAFF_ROLES: Record<string, string> = {
  HEAD: "หัวหน้าอคาเดมี",
  COACH: "ผู้ฝึกสอน",
  ASSISTANT: "ผู้ช่วยผู้ฝึกสอน",
  GK_COACH: "ผู้ฝึกสอนผู้รักษาประตู",
  FITNESS: "ผู้ฝึกสอนฟิตเนส",
  MEDICAL: "เจ้าหน้าที่การแพทย์",
  ADMIN: "เจ้าหน้าที่ / เลขานุการ",
  OTHER: "อื่น ๆ",
};
export const LICENCE_LEVELS: Record<string, string> = { PRO: "AFC Pro", A: "AFC A", B: "AFC B", C: "AFC C", OTHER: "อื่น ๆ" };
export const LICENCE_RANK: Record<string, number> = { C: 1, B: 2, A: 3, PRO: 4 };
export const POSITIONS: Record<string, string> = { GK: "ผู้รักษาประตู", DF: "กองหลัง", MF: "กองกลาง", FW: "กองหน้า" };

// ข้อกำหนดตามระดับ (เกณฑ์ 1.1.3 / 1.3.1 / 1.6.1 / 1.6.2)
const REQ: Record<AcademyLevel, { head: string; coaches: { n: number; min: string }; assistants?: { n: number; min: string }; teams: number }> = {
  BRONZE: { head: "C", coaches: { n: 1, min: "C" }, teams: 1 },
  SILVER: { head: "B", coaches: { n: 2, min: "C" }, teams: 2 },
  GOLD: { head: "A", coaches: { n: 3, min: "B" }, assistants: { n: 3, min: "C" }, teams: 3 },
};

export type StaffForCheck = { name: string; role: string; licence: string | null; verifiedLicence: string | null };
export type TeamForCheck = { name: string; ageGroup: number; players: { position: string }[] };
export type AutoCheck = { ok: boolean; detail: string };

// ใบอนุญาตที่ใช้นับ: ยืนยันจากฐานข้อมูลผู้ฝึกสอน (ถ้าผูกไว้) ไม่งั้นใช้ที่อคาเดมีแจ้ง
export const effectiveLicence = (s: StaffForCheck) => s.verifiedLicence ?? s.licence;
const atLeast = (licence: string | null, min: string) => (LICENCE_RANK[licence ?? ""] ?? 0) >= LICENCE_RANK[min];

// นักเตะขั้นต่ำต่อทีม: U12 ลงไป 12 คน · อื่นๆ 18 คน · ผู้รักษาประตู 2 คนทุกรุ่น
export const minPlayers = (ageGroup: number) => (ageGroup <= 12 ? 12 : 18);
export function teamCheck(t: TeamForCheck): AutoCheck {
  const gk = t.players.filter((p) => p.position === "GK").length;
  const need = minPlayers(t.ageGroup);
  return { ok: t.players.length >= need && gk >= 2, detail: `${t.name}: ${t.players.length}/${need} คน · ผู้รักษาประตู ${gk}/2` };
}

export function autoChecks(level: AcademyLevel, staff: StaffForCheck[], teams: TeamForCheck[]): Record<string, AutoCheck> {
  const req = REQ[level];
  const heads = staff.filter((s) => s.role === "HEAD");
  const headOk = heads.some((s) => atLeast(effectiveLicence(s), req.head));
  const coaches = staff.filter((s) => (s.role === "HEAD" || s.role === "COACH") && atLeast(effectiveLicence(s), req.coaches.min));
  const assistants = req.assistants ? staff.filter((s) => s.role === "ASSISTANT" && atLeast(effectiveLicence(s), req.assistants!.min)) : [];
  const teamResults = teams.map(teamCheck);
  return {
    "1.1.3": {
      ok: headOk,
      detail: heads.length
        ? `หัวหน้าอคาเดมี: ${heads.map((h) => `${h.name} (${LICENCE_LEVELS[effectiveLicence(h) ?? ""] ?? "ไม่มีใบอนุญาต"})`).join(", ")} · ต้องการ AFC ${req.head} ขึ้นไป`
        : "ยังไม่ได้ระบุหัวหน้าอคาเดมีในรายชื่อบุคลากร",
    },
    "1.3.1": {
      ok: coaches.length >= req.coaches.n && (!req.assistants || assistants.length >= req.assistants.n),
      detail:
        `ผู้ฝึกสอน AFC ${req.coaches.min} ขึ้นไป ${coaches.length}/${req.coaches.n} คน` +
        (req.assistants ? ` · ผู้ช่วยผู้ฝึกสอน AFC ${req.assistants.min} ขึ้นไป ${assistants.length}/${req.assistants.n} คน` : ""),
    },
    "1.6.1": { ok: teams.length >= req.teams, detail: `มีทีม ${teams.length}/${req.teams} ทีม${teams.length ? ` (${teams.map((t) => t.name).join(", ")})` : ""}` },
    "1.6.2": {
      ok: teams.length > 0 && teamResults.every((r) => r.ok),
      detail: teamResults.length ? teamResults.map((r) => r.detail).join(" · ") : "ยังไม่มีทีม",
    },
  };
}

// ระดับใบอนุญาตสูงสุดที่ยังไม่หมดอายุของผู้ฝึกสอน (จากฐานข้อมูลใบอนุญาต) — ไม่นับใบ Grassroots / GK
export function verifiedCoachLicence(records: { licenseType: string; expireDate: Date | null }[], now: Date) {
  let best: string | null = null;
  for (const r of records) {
    if (!(r.licenseType in LICENCE_RANK)) continue;
    if (r.expireDate && r.expireDate < now) continue;
    if (!best || LICENCE_RANK[r.licenseType] > LICENCE_RANK[best]) best = r.licenseType;
  }
  return best;
}
