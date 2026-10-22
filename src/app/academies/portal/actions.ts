"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { audit, changedFields } from "@/lib/audit";
import { saveUploadedPhoto } from "@/lib/upload";
import { requireAcademy, EDITABLE_STATUSES, OPEN_STATUSES } from "@/lib/academy-portal";
import { currentLicence, isLevel, levelRank, licenceState, parseFormDate, LEVEL_META } from "@/lib/academy";
import { criteriaList } from "@/lib/academy-criteria";
import { autoChecks, LICENCE_RANK, POSITIONS, STAFF_ROLES } from "@/lib/academy-checks";
import { docsEnabled, removeStoredDocument, storeDocument } from "@/lib/academy-docs";
import { coachName } from "@/lib/coach-name";
import type { FormResult } from "@/components/ResultForm";

type Ctx = Awaited<ReturnType<typeof requireAcademy>>;

async function attempt(fn: (ctx: Ctx) => Promise<void>): Promise<FormResult> {
  try {
    const ctx = await requireAcademy();
    await fn(ctx);
    revalidatePath("/academies", "layout");
    return { ok: true };
  } catch (err) {
    unstable_rethrow(err);
    return { ok: false, error: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ" };
  }
}

const text = (fd: FormData, key: string) =>
  String(fd.get(key) ?? "")
    .replace(/\r\n?/g, "\n")
    .trim();
const optional = (fd: FormData, key: string) => text(fd, key) || null;
const idOf = (fd: FormData, key = "id") => {
  const id = Number(fd.get(key));
  if (!Number.isInteger(id) || id <= 0) throw new Error("ไม่พบรายการ");
  return id;
};
const fileOf = (fd: FormData, key: string) => {
  const f = fd.get(key);
  return f instanceof File && f.size > 0 ? f : null;
};

// ===================== ข้อมูลอคาเดมี =====================
export async function updateProfile(formData: FormData) {
  return attempt(async ({ user, member }) => {
    const before = member.academy;
    const nameEn = text(formData, "nameEn");
    if (!nameEn) throw new Error("กรุณากรอกชื่ออคาเดมี (ภาษาอังกฤษ)");
    const email = optional(formData, "email");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("อีเมลไม่ถูกต้อง");
    const website = optional(formData, "website");
    if (website && !/^https?:\/\/\S+$/i.test(website)) throw new Error("เว็บไซต์ต้องขึ้นต้นด้วย http:// หรือ https://");
    const logo = await saveUploadedPhoto(fileOf(formData, "logo"));
    const data = {
      nameEn,
      nameTh: optional(formData, "nameTh"),
      province: optional(formData, "province"),
      address: optional(formData, "address"),
      parentClub: optional(formData, "parentClub"),
      contactName: optional(formData, "contactName"),
      phone: optional(formData, "phone"),
      email,
      website,
      logoUrl: logo ?? (formData.get("removeLogo") === "on" ? null : before.logoUrl),
    };
    await prisma.academy.update({ where: { id: before.id }, data });
    const changes = changedFields(before, data);
    if (Object.keys(changes).length)
      await audit(user.email, "ACADEMY_UPDATE", { summary: `อคาเดมีแก้ไขข้อมูลเอง (${Object.keys(changes).join(", ")})`, details: { academyId: before.id, changes } });
  });
}

// ===================== บุคลากร =====================
// ผูกกับฐานข้อมูลผู้ฝึกสอนด้วย AFC ID หรือเลขที่ใบอนุญาต (ต้องตรงทั้งค่า — ไม่เปิดให้ค้นรายชื่อผู้ฝึกสอนทั้งหมด)
async function findCoach(ref: string) {
  const byAfc = await prisma.coach.findUnique({ where: { afcId: ref }, include: { licenseRecords: true } });
  if (byAfc) return byAfc;
  const rec = await prisma.licenseRecord.findFirst({ where: { certificateNo: { equals: ref, mode: "insensitive" } }, select: { coachId: true } });
  return rec ? prisma.coach.findUnique({ where: { id: rec.coachId }, include: { licenseRecords: true } }) : null;
}

// existingCoachId = ตอนแก้ไข: ไม่กรอก AFC ID ใหม่ = คงการผูกเดิมไว้ (เว้นแต่ติ๊กยกเลิกการผูก)
async function readStaff(formData: FormData, existingCoachId: number | null = null) {
  const role = text(formData, "role");
  if (!(role in STAFF_ROLES)) throw new Error("กรุณาเลือกหน้าที่");
  const licence = optional(formData, "licence");
  if (licence && !(licence in LICENCE_RANK) && licence !== "OTHER") throw new Error("ระดับใบอนุญาตไม่ถูกต้อง");
  const ref = text(formData, "coachRef");
  let coachId: number | null = formData.get("unlinkCoach") === "on" ? null : existingCoachId;
  let name = text(formData, "name");
  if (ref) {
    const coach = await findCoach(ref);
    if (!coach) throw new Error("ไม่พบผู้ฝึกสอนจาก AFC ID / เลขที่ใบอนุญาตนี้ในฐานข้อมูลของสมาคมฯ");
    coachId = coach.id;
    name ||= coachName(coach);
  }
  if (!name) throw new Error("กรุณากรอกชื่อ-สกุล");
  return { name, role, licence, coachId, phone: optional(formData, "phone"), email: optional(formData, "email"), note: optional(formData, "note") };
}

export async function addStaff(formData: FormData) {
  return attempt(async ({ member }) => {
    await prisma.academyStaff.create({ data: { academyId: member.academyId, ...(await readStaff(formData)) } });
  });
}

export async function updateStaff(formData: FormData) {
  return attempt(async ({ member }) => {
    const id = idOf(formData);
    const staff = await prisma.academyStaff.findFirst({ where: { id, academyId: member.academyId } });
    if (!staff) throw new Error("ไม่พบรายการ");
    await prisma.academyStaff.update({ where: { id }, data: await readStaff(formData, staff.coachId) });
  });
}

export async function deleteStaff(formData: FormData) {
  return attempt(async ({ member }) => {
    await prisma.academyStaff.deleteMany({ where: { id: idOf(formData), academyId: member.academyId } });
  });
}

// ===================== ทีม / นักเตะ =====================
function readTeam(formData: FormData) {
  const ageGroup = Number(text(formData, "ageGroup"));
  if (!Number.isInteger(ageGroup) || ageGroup < 6 || ageGroup > 23) throw new Error("กรุณาเลือกรุ่นอายุ");
  const gender = text(formData, "gender") || "MIXED";
  if (!["BOYS", "GIRLS", "MIXED"].includes(gender)) throw new Error("ประเภททีมไม่ถูกต้อง");
  return { name: text(formData, "name") || `U${ageGroup}`, ageGroup, gender, note: optional(formData, "note") };
}

export async function addTeam(formData: FormData) {
  return attempt(async ({ member }) => {
    await prisma.academyTeam.create({ data: { academyId: member.academyId, ...readTeam(formData) } });
  });
}

export async function updateTeam(formData: FormData) {
  return attempt(async ({ member }) => {
    const id = idOf(formData);
    if (!(await prisma.academyTeam.findFirst({ where: { id, academyId: member.academyId } }))) throw new Error("ไม่พบทีม");
    await prisma.academyTeam.update({ where: { id }, data: readTeam(formData) });
  });
}

export async function deleteTeam(formData: FormData): Promise<FormResult> {
  const res = await attempt(async ({ member }) => {
    await prisma.academyTeam.deleteMany({ where: { id: idOf(formData), academyId: member.academyId } });
  });
  if (res.ok) redirect("/academies/portal/teams");
  return res;
}

// ยืนยันความยินยอมของผู้ปกครองก่อนเริ่มกรอกข้อมูลนักเตะ (PDPA) — บันทึกครั้งเดียวต่ออคาเดมี
export async function givePlayerConsent(formData: FormData) {
  return attempt(async ({ user, member }) => {
    if (formData.get("consent") !== "on") throw new Error("กรุณาติ๊กยืนยัน");
    await prisma.academy.update({ where: { id: member.academyId }, data: { playerConsentAt: new Date(), playerConsentBy: user.email } });
  });
}

async function readPlayer(formData: FormData) {
  const firstName = text(formData, "firstName");
  const lastName = text(formData, "lastName");
  if (!firstName || !lastName) throw new Error("กรุณากรอกชื่อและนามสกุล");
  const position = text(formData, "position");
  if (!(position in POSITIONS)) throw new Error("กรุณาเลือกตำแหน่ง");
  const birthRaw = text(formData, "birthDate");
  const birthDate = birthRaw ? parseFormDate(birthRaw) : null;
  if (birthRaw && !birthDate) throw new Error("วันเกิดไม่ถูกต้อง");
  if (birthDate && birthDate > new Date()) throw new Error("วันเกิดต้องไม่เป็นวันในอนาคต");
  const shirt = text(formData, "shirtNo");
  const shirtNo = shirt ? Number(shirt) : null;
  if (shirtNo !== null && (!Number.isInteger(shirtNo) || shirtNo < 1 || shirtNo > 99)) throw new Error("เบอร์เสื้อต้องเป็น 1–99");
  return { firstName, lastName, nickname: optional(formData, "nickname"), birthDate, position, shirtNo };
}

async function ownTeam(teamId: number, academyId: number) {
  const team = await prisma.academyTeam.findFirst({ where: { id: teamId, academyId }, include: { academy: { select: { playerConsentAt: true } } } });
  if (!team) throw new Error("ไม่พบทีม");
  if (!team.academy.playerConsentAt) throw new Error("กรุณายืนยันความยินยอมของผู้ปกครองก่อนกรอกข้อมูลนักเตะ");
  return team;
}

export async function addPlayer(formData: FormData) {
  return attempt(async ({ member }) => {
    const team = await ownTeam(idOf(formData, "teamId"), member.academyId);
    await prisma.academyPlayer.create({ data: { teamId: team.id, ...(await readPlayer(formData)) } });
  });
}

export async function updatePlayer(formData: FormData) {
  return attempt(async ({ member }) => {
    const id = idOf(formData);
    const player = await prisma.academyPlayer.findFirst({ where: { id, team: { academyId: member.academyId } } });
    if (!player) throw new Error("ไม่พบนักเตะ");
    await ownTeam(player.teamId, member.academyId);
    await prisma.academyPlayer.update({ where: { id }, data: await readPlayer(formData) });
  });
}

export async function deletePlayer(formData: FormData) {
  return attempt(async ({ member }) => {
    await prisma.academyPlayer.deleteMany({ where: { id: idOf(formData), team: { academyId: member.academyId } } });
  });
}

// ===================== ใบสมัคร =====================
export async function createApplication(formData: FormData): Promise<FormResult> {
  let newId = 0;
  const res = await attempt(async ({ user, member }) => {
    const level = text(formData, "level");
    if (!isLevel(level)) throw new Error("กรุณาเลือกระดับที่ต้องการขอ");
    const academy = await prisma.academy.findUnique({ where: { id: member.academyId }, include: { licences: true, applications: { select: { status: true } } } });
    if (!academy) throw new Error("ไม่พบอคาเดมี");
    if (academy.applications.some((a) => OPEN_STATUSES.includes(a.status))) throw new Error("มีใบสมัครที่ยังดำเนินการอยู่ — ทำใบเดิมให้เสร็จก่อน");
    const current = currentLicence(academy.licences);
    const state = licenceState(current, new Date());
    const holding = current && state !== "revoked" && state !== "expired" && isLevel(current.level) ? current.level : null;
    if (holding && levelRank(level) < levelRank(holding)) throw new Error(`ระดับที่ขอต่ำกว่าระดับปัจจุบัน (${LEVEL_META[holding].label})`);
    const kind = !holding ? "NEW" : level === holding ? "RENEWAL" : "UPGRADE";
    const app = await prisma.academyApplication.create({
      data: { academyId: academy.id, kind, level, evidence: { create: criteriaList(level).map((c) => ({ criterion: c.code })) } },
    });
    newId = app.id;
    await audit(user.email, "ACADEMY_APPLICATION", { summary: `เริ่มใบสมัคร ${LEVEL_META[level].label} (${kind})`, details: { academyId: academy.id, applicationId: app.id } });
  });
  if (res.ok) redirect(`/academies/portal/applications/${newId}`);
  return res;
}

async function editableEvidence(evidenceId: number, academyId: number) {
  const ev = await prisma.academyEvidence.findFirst({ where: { id: evidenceId, application: { academyId } }, include: { application: true } });
  if (!ev) throw new Error("ไม่พบรายการ");
  if (!EDITABLE_STATUSES.includes(ev.application.status)) throw new Error("ใบสมัครนี้ส่งแล้ว แก้ไขไม่ได้ระหว่างรอตรวจ");
  return ev;
}

export async function saveEvidence(formData: FormData) {
  return attempt(async ({ user, member }) => {
    const ev = await editableEvidence(idOf(formData), member.academyId);
    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length && !docsEnabled()) throw new Error("ระบบแนบเอกสารยังไม่พร้อมใช้งาน — กรอกคำอธิบายไว้ก่อน แล้วแนบภายหลัง");
    for (const f of files) {
      const stored = await storeDocument(f, member.academyId);
      await prisma.academyDocument.create({ data: { academyId: member.academyId, evidenceId: ev.id, uploadedBy: user.email, ...stored } });
    }
    await prisma.academyEvidence.update({ where: { id: ev.id }, data: { note: optional(formData, "note") } });
  });
}

export async function deleteDocument(formData: FormData) {
  return attempt(async ({ member }) => {
    const doc = await prisma.academyDocument.findFirst({ where: { id: idOf(formData), academyId: member.academyId } });
    if (!doc) throw new Error("ไม่พบเอกสาร");
    if (doc.evidenceId) await editableEvidence(doc.evidenceId, member.academyId);
    await prisma.academyDocument.delete({ where: { id: doc.id } });
    await removeStoredDocument(doc.fileKey);
  });
}

export async function submitApplication(formData: FormData) {
  return attempt(async ({ user, member }) => {
    const app = await prisma.academyApplication.findFirst({
      where: { id: idOf(formData), academyId: member.academyId },
      include: { evidence: { include: { _count: { select: { documents: true } } } } },
    });
    if (!app) throw new Error("ไม่พบใบสมัคร");
    if (!EDITABLE_STATUSES.includes(app.status)) throw new Error("ใบสมัครนี้ส่งแล้ว");
    const level = app.level as Parameters<typeof criteriaList>[0];
    const auto = autoChecks(level, [], []);
    // ทุกข้อต้องมีคำอธิบายหรือเอกสาร (ข้อที่ระบบตรวจจากข้อมูลบุคลากร/ทีมได้ ไม่บังคับ)
    const missing = app.evidence.filter((e) => !(e.criterion in auto) && !e.note && e._count.documents === 0).map((e) => e.criterion);
    if (missing.length) throw new Error(`ยังไม่ได้กรอกคำอธิบายหรือแนบเอกสาร ${missing.length} ข้อ: ${missing.join(", ")}`);
    await prisma.$transaction([
      // ข้อที่เคยถูกขอให้แก้ → กลับไปรอตรวจใหม่
      prisma.academyEvidence.updateMany({ where: { applicationId: app.id, status: { in: ["FIX", "FAIL"] } }, data: { status: "PENDING" } }),
      prisma.academyApplication.update({ where: { id: app.id }, data: { status: "SUBMITTED", submittedAt: new Date() } }),
    ]);
    await audit(user.email, "ACADEMY_APPLICATION", {
      summary: `ส่งใบสมัคร ${LEVEL_META[level].label}${app.status === "NEEDS_FIX" ? " (ส่งแก้ไข)" : ""}`,
      details: { academyId: member.academyId, applicationId: app.id },
    });
  });
}

export async function deleteDraft(formData: FormData): Promise<FormResult> {
  const res = await attempt(async ({ member }) => {
    const app = await prisma.academyApplication.findFirst({ where: { id: idOf(formData), academyId: member.academyId, status: "DRAFT" }, include: { evidence: { include: { documents: true } } } });
    if (!app) throw new Error("ลบได้เฉพาะใบสมัครที่ยังไม่ได้ส่ง");
    await prisma.academyApplication.delete({ where: { id: app.id } });
    for (const d of app.evidence.flatMap((e) => e.documents)) await removeStoredDocument(d.fileKey);
  });
  if (res.ok) redirect("/academies/portal/applications");
  return res;
}

// ===================== การแจ้งเตือน =====================
export async function markNoticesRead() {
  return attempt(async ({ member }) => {
    await prisma.academyNotice.updateMany({ where: { academyId: member.academyId, readAt: null }, data: { readAt: new Date() } });
  });
}
