"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { saveUploadedPhoto } from "@/lib/upload";
import { parseBangkokDateTimeLocal } from "@/lib/g15";
import { revalidatePath } from "next/cache";

async function requireAdminOrStaff() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    throw new Error("เฉพาะผู้ดูแลระบบและเจ้าหน้าที่เท่านั้นที่ทำรายการนี้ได้");
  }
  return user;
}

function revalidateG15(teamId?: number) {
  revalidatePath("/g15-womens-series");
  revalidatePath("/g15-womens-series/manage");
  if (teamId) {
    revalidatePath(`/g15-womens-series/teams/${teamId}`);
    revalidatePath(`/g15-womens-series/manage/teams/${teamId}`);
  }
}

function str(formData: FormData, key: string) {
  const v = String(formData.get(key) ?? "").trim();
  return v || null;
}

function int(formData: FormData, key: string) {
  const v = String(formData.get(key) ?? "").trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function float(formData: FormData, key: string) {
  const v = String(formData.get(key) ?? "").trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function dateOnly(formData: FormData, key: string) {
  const v = String(formData.get(key) ?? "").trim();
  return v ? new Date(v) : null;
}

// saveUploadedPhoto โยน Error ได้ (ชนิดไฟล์ไม่รองรับ/ไฟล์ใหญ่เกิน/อัปโหลดล้มเหลว) — ถ้าไม่ดัก
// การอัปเดตทั้งฟอร์ม (เช่น ชื่อทีม) จะพังไปด้วยเพราะ Server Action โยน error ที่ไม่มีใครจับ
// จึงถือว่า "อัปโหลดโลโก้ไม่สำเร็จ" เท่ากับ "ไม่ได้แนบโลโก้ใหม่" แล้วให้ฟิลด์อื่นบันทึกต่อไปได้ตามปกติ
async function trySaveUploadedPhoto(file: File | null): Promise<string | null> {
  try {
    return await saveUploadedPhoto(file);
  } catch (err) {
    console.error("อัปโหลดโลโก้ไม่สำเร็จ:", err);
    return null;
  }
}

// ===== ทีม =====

export async function createTeam(formData: FormData) {
  await requireAdminOrStaff();

  const name = String(formData.get("name") ?? "").trim();
  const groupName = String(formData.get("groupName") ?? "").trim();

  if (!name) {
    throw new Error("กรุณากรอกชื่อทีม");
  }

  const logoUrl = await trySaveUploadedPhoto(formData.get("logo") as File | null);

  await prisma.g15Team.create({
    data: {
      name,
      groupName: groupName || null,
      logoUrl,
    },
  });

  revalidateG15();
}

export async function updateTeam(formData: FormData) {
  await requireAdminOrStaff();

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const groupName = String(formData.get("groupName") ?? "").trim();

  if (!name) {
    throw new Error("กรุณากรอกชื่อทีม");
  }

  const newLogoUrl = await trySaveUploadedPhoto(formData.get("logo") as File | null);

  await prisma.g15Team.update({
    where: { id },
    data: {
      name,
      groupName: groupName || null,
      ...(newLogoUrl ? { logoUrl: newLogoUrl } : {}),
    },
  });

  revalidateG15(id);
}

export async function deleteTeam(formData: FormData) {
  await requireAdminOrStaff();
  const id = Number(formData.get("id"));

  await prisma.g15Team.delete({ where: { id } });

  revalidateG15();
}

// ===== นัดการแข่งขัน =====

export async function createMatch(formData: FormData) {
  await requireAdminOrStaff();

  const round = String(formData.get("round") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const matchDateRaw = String(formData.get("matchDate") ?? "").trim();
  const homeTeamId = Number(formData.get("homeTeamId"));
  const awayTeamId = Number(formData.get("awayTeamId"));

  if (!round || !homeTeamId || !awayTeamId) {
    throw new Error("กรุณากรอกรอบการแข่งขันและเลือกทีมเหย้า/ทีมเยือน");
  }
  if (homeTeamId === awayTeamId) {
    throw new Error("ทีมเหย้าและทีมเยือนต้องไม่ใช่ทีมเดียวกัน");
  }

  await prisma.g15Match.create({
    data: {
      round,
      venue: venue || null,
      matchDate: parseBangkokDateTimeLocal(matchDateRaw),
      homeTeamId,
      awayTeamId,
    },
  });

  revalidateG15();
}

export async function updateMatch(formData: FormData) {
  await requireAdminOrStaff();

  const id = Number(formData.get("id"));
  const round = String(formData.get("round") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const matchDateRaw = String(formData.get("matchDate") ?? "").trim();
  const homeTeamId = Number(formData.get("homeTeamId"));
  const awayTeamId = Number(formData.get("awayTeamId"));
  const homeScoreRaw = String(formData.get("homeScore") ?? "").trim();
  const awayScoreRaw = String(formData.get("awayScore") ?? "").trim();

  if (!round || !homeTeamId || !awayTeamId) {
    throw new Error("กรุณากรอกรอบการแข่งขันและเลือกทีมเหย้า/ทีมเยือน");
  }
  if (homeTeamId === awayTeamId) {
    throw new Error("ทีมเหย้าและทีมเยือนต้องไม่ใช่ทีมเดียวกัน");
  }

  const homeScore = homeScoreRaw ? Number(homeScoreRaw) : null;
  const awayScore = awayScoreRaw ? Number(awayScoreRaw) : null;
  if ((homeScore != null && !Number.isFinite(homeScore)) || (awayScore != null && !Number.isFinite(awayScore))) {
    throw new Error("กรุณากรอกผลการแข่งขันเป็นตัวเลข");
  }

  await prisma.g15Match.update({
    where: { id },
    data: {
      round,
      venue: venue || null,
      matchDate: parseBangkokDateTimeLocal(matchDateRaw),
      homeTeamId,
      awayTeamId,
      homeScore,
      awayScore,
      status: homeScore != null && awayScore != null ? "FINISHED" : "SCHEDULED",
    },
  });

  revalidateG15();
}

export async function deleteMatch(formData: FormData) {
  await requireAdminOrStaff();
  const id = Number(formData.get("id"));

  await prisma.g15Match.delete({ where: { id } });

  revalidateG15();
}

// ===== นักกีฬา =====
// หมายเหตุ: ไม่รับ/ไม่แก้ไข idCardNumber, passportNumber ผ่านฟอร์มนี้ — ข้อมูลอ่อนไหวคงไว้เฉพาะที่นำเข้าจากทะเบียนทางการเท่านั้น

export async function createPlayer(formData: FormData) {
  await requireAdminOrStaff();
  const teamId = Number(formData.get("teamId"));
  const firstNameTh = String(formData.get("firstNameTh") ?? "").trim();
  const lastNameTh = String(formData.get("lastNameTh") ?? "").trim();

  if (!teamId || !firstNameTh || !lastNameTh) {
    throw new Error("กรุณากรอกชื่อ-นามสกุลนักกีฬา");
  }

  await prisma.g15Player.create({
    data: {
      teamId,
      firstNameTh,
      lastNameTh,
      no: int(formData, "no"),
      firstNameEn: str(formData, "firstNameEn"),
      lastNameEn: str(formData, "lastNameEn"),
      nationality: str(formData, "nationality"),
      jerseyName: str(formData, "jerseyName"),
      jerseyNumber: int(formData, "jerseyNumber"),
      position: str(formData, "position"),
      dob: dateOnly(formData, "dob"),
      weightKg: float(formData, "weightKg"),
      heightCm: float(formData, "heightCm"),
    },
  });

  revalidateG15(teamId);
}

export async function updatePlayer(formData: FormData) {
  await requireAdminOrStaff();
  const id = Number(formData.get("id"));
  const teamId = Number(formData.get("teamId"));
  const firstNameTh = String(formData.get("firstNameTh") ?? "").trim();
  const lastNameTh = String(formData.get("lastNameTh") ?? "").trim();

  if (!firstNameTh || !lastNameTh) {
    throw new Error("กรุณากรอกชื่อ-นามสกุลนักกีฬา");
  }

  await prisma.g15Player.update({
    where: { id },
    data: {
      firstNameTh,
      lastNameTh,
      no: int(formData, "no"),
      firstNameEn: str(formData, "firstNameEn"),
      lastNameEn: str(formData, "lastNameEn"),
      nationality: str(formData, "nationality"),
      jerseyName: str(formData, "jerseyName"),
      jerseyNumber: int(formData, "jerseyNumber"),
      position: str(formData, "position"),
      dob: dateOnly(formData, "dob"),
      weightKg: float(formData, "weightKg"),
      heightCm: float(formData, "heightCm"),
    },
  });

  revalidateG15(teamId);
}

export async function deletePlayer(formData: FormData) {
  await requireAdminOrStaff();
  const id = Number(formData.get("id"));
  const teamId = Number(formData.get("teamId"));

  await prisma.g15Player.delete({ where: { id } });

  revalidateG15(teamId);
}

// ===== เจ้าหน้าที่ =====

export async function createOfficial(formData: FormData) {
  await requireAdminOrStaff();
  const teamId = Number(formData.get("teamId"));
  const firstNameTh = String(formData.get("firstNameTh") ?? "").trim();
  const lastNameTh = String(formData.get("lastNameTh") ?? "").trim();

  if (!teamId || !firstNameTh || !lastNameTh) {
    throw new Error("กรุณากรอกชื่อ-นามสกุลเจ้าหน้าที่");
  }

  await prisma.g15Official.create({
    data: {
      teamId,
      firstNameTh,
      lastNameTh,
      no: int(formData, "no"),
      firstNameEn: str(formData, "firstNameEn"),
      lastNameEn: str(formData, "lastNameEn"),
      gender: str(formData, "gender"),
      nationality: str(formData, "nationality"),
      role: str(formData, "role"),
      dob: dateOnly(formData, "dob"),
      coachingLicense: str(formData, "coachingLicense"),
    },
  });

  revalidateG15(teamId);
}

export async function updateOfficial(formData: FormData) {
  await requireAdminOrStaff();
  const id = Number(formData.get("id"));
  const teamId = Number(formData.get("teamId"));
  const firstNameTh = String(formData.get("firstNameTh") ?? "").trim();
  const lastNameTh = String(formData.get("lastNameTh") ?? "").trim();

  if (!firstNameTh || !lastNameTh) {
    throw new Error("กรุณากรอกชื่อ-นามสกุลเจ้าหน้าที่");
  }

  await prisma.g15Official.update({
    where: { id },
    data: {
      firstNameTh,
      lastNameTh,
      no: int(formData, "no"),
      firstNameEn: str(formData, "firstNameEn"),
      lastNameEn: str(formData, "lastNameEn"),
      gender: str(formData, "gender"),
      nationality: str(formData, "nationality"),
      role: str(formData, "role"),
      dob: dateOnly(formData, "dob"),
      coachingLicense: str(formData, "coachingLicense"),
    },
  });

  revalidateG15(teamId);
}

export async function deleteOfficial(formData: FormData) {
  await requireAdminOrStaff();
  const id = Number(formData.get("id"));
  const teamId = Number(formData.get("teamId"));

  await prisma.g15Official.delete({ where: { id } });

  revalidateG15(teamId);
}
