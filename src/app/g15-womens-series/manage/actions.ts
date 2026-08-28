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

function revalidateG15(teamId?: number, matchId?: number) {
  revalidatePath("/g15-womens-series");
  revalidatePath("/g15-womens-series/matches");
  revalidatePath("/g15-womens-series/standings");
  revalidatePath("/g15-womens-series/stats");
  revalidatePath("/g15-womens-series/teams");
  revalidatePath("/g15-womens-series/stadium");
  revalidatePath("/g15-womens-series/manage");
  if (teamId) {
    revalidatePath(`/g15-womens-series/teams/${teamId}`);
    revalidatePath(`/g15-womens-series/manage/teams/${teamId}`);
  }
  if (matchId) {
    revalidatePath(`/g15-womens-series/matches/${matchId}`);
    revalidatePath(`/g15-womens-series/manage/matches/${matchId}`);
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

// ===== รายละเอียดนัดการแข่งขัน (ทีมงานผู้ตัดสิน / ผู้ทำประตู / เปลี่ยนตัว / ใบเหลือง-ใบแดง) =====
// จากใบรายงานผู้ตัดสินของแต่ละนัด — เก็บแยกจาก homeScore/awayScore ที่ใช้คำนวณตารางคะแนน

export async function updateMatchOfficials(formData: FormData) {
  await requireAdminOrStaff();
  const id = Number(formData.get("id"));

  await prisma.g15Match.update({
    where: { id },
    data: {
      referee: str(formData, "referee"),
      assistantReferee1: str(formData, "assistantReferee1"),
      assistantReferee2: str(formData, "assistantReferee2"),
      fourthOfficial: str(formData, "fourthOfficial"),
      matchCommissioner: str(formData, "matchCommissioner"),
      refereeAssessor: str(formData, "refereeAssessor"),
      generalCoordinator: str(formData, "generalCoordinator"),
      firstHalfHomeScore: int(formData, "firstHalfHomeScore"),
      firstHalfAwayScore: int(formData, "firstHalfAwayScore"),
      secondHalfHomeScore: int(formData, "secondHalfHomeScore"),
      secondHalfAwayScore: int(formData, "secondHalfAwayScore"),
    },
  });

  revalidateG15(undefined, id);
}

// เลือกได้ 2 ทาง: เลือกนักกีฬาจากทะเบียน (ผูก player_id ให้อัตโนมัติ) หรือกรอกทีม/ชื่อเอง — ถ้าเลือกจากทะเบียน ค่าที่เลือกเป็นหลัก
async function resolveGoalData(formData: FormData) {
  const playerId = int(formData, "playerId");
  if (playerId) {
    const player = await prisma.g15Player.findUnique({ where: { id: playerId } });
    if (!player) throw new Error("ไม่พบนักกีฬาที่เลือกในทะเบียน");
    return {
      teamId: player.teamId,
      playerId: player.id,
      playerName: `${player.firstNameTh} ${player.lastNameTh}`,
      jerseyNumber: player.jerseyNumber,
    };
  }

  const teamId = Number(formData.get("teamId"));
  const playerName = String(formData.get("playerName") ?? "").trim();
  if (!teamId || !playerName) {
    throw new Error("กรุณาเลือกนักกีฬาจากทะเบียน หรือเลือกทีมและกรอกชื่อผู้ทำประตูเอง");
  }
  return { teamId, playerId: null, playerName, jerseyNumber: int(formData, "jerseyNumber") };
}

export async function createGoal(formData: FormData) {
  await requireAdminOrStaff();
  const matchId = Number(formData.get("matchId"));
  if (!matchId) throw new Error("ไม่พบนัดการแข่งขัน");
  const goalData = await resolveGoalData(formData);

  await prisma.g15Goal.create({
    data: { matchId, ...goalData, minute: int(formData, "minute") },
  });

  revalidateG15(undefined, matchId);
}

export async function updateGoal(formData: FormData) {
  await requireAdminOrStaff();
  const id = Number(formData.get("id"));
  const matchId = Number(formData.get("matchId"));
  const goalData = await resolveGoalData(formData);

  await prisma.g15Goal.update({
    where: { id },
    data: { ...goalData, minute: int(formData, "minute") },
  });

  revalidateG15(undefined, matchId);
}

export async function deleteGoal(formData: FormData) {
  await requireAdminOrStaff();
  const id = Number(formData.get("id"));
  const matchId = Number(formData.get("matchId"));

  await prisma.g15Goal.delete({ where: { id } });

  revalidateG15(undefined, matchId);
}

export async function createSubstitution(formData: FormData) {
  await requireAdminOrStaff();
  const matchId = Number(formData.get("matchId"));
  const teamId = Number(formData.get("teamId"));
  const playerInName = String(formData.get("playerInName") ?? "").trim();
  const playerOutName = String(formData.get("playerOutName") ?? "").trim();

  if (!matchId || !teamId || !playerInName || !playerOutName) {
    throw new Error("กรุณาเลือกทีมและกรอกชื่อผู้เล่นที่เปลี่ยนตัวเข้า-ออก");
  }

  await prisma.g15Substitution.create({
    data: {
      matchId,
      teamId,
      minute: int(formData, "minute"),
      playerInName,
      playerInNumber: int(formData, "playerInNumber"),
      playerOutName,
      playerOutNumber: int(formData, "playerOutNumber"),
    },
  });

  revalidateG15(undefined, matchId);
}

export async function updateSubstitution(formData: FormData) {
  await requireAdminOrStaff();
  const id = Number(formData.get("id"));
  const matchId = Number(formData.get("matchId"));
  const teamId = Number(formData.get("teamId"));
  const playerInName = String(formData.get("playerInName") ?? "").trim();
  const playerOutName = String(formData.get("playerOutName") ?? "").trim();

  if (!teamId || !playerInName || !playerOutName) {
    throw new Error("กรุณาเลือกทีมและกรอกชื่อผู้เล่นที่เปลี่ยนตัวเข้า-ออก");
  }

  await prisma.g15Substitution.update({
    where: { id },
    data: {
      teamId,
      minute: int(formData, "minute"),
      playerInName,
      playerInNumber: int(formData, "playerInNumber"),
      playerOutName,
      playerOutNumber: int(formData, "playerOutNumber"),
    },
  });

  revalidateG15(undefined, matchId);
}

export async function deleteSubstitution(formData: FormData) {
  await requireAdminOrStaff();
  const id = Number(formData.get("id"));
  const matchId = Number(formData.get("matchId"));

  await prisma.g15Substitution.delete({ where: { id } });

  revalidateG15(undefined, matchId);
}

export async function createCard(formData: FormData) {
  await requireAdminOrStaff();
  const matchId = Number(formData.get("matchId"));
  const teamId = Number(formData.get("teamId"));
  const holderName = String(formData.get("holderName") ?? "").trim();
  const cardType = String(formData.get("cardType") ?? "").trim();

  if (!matchId || !teamId || !holderName || !cardType) {
    throw new Error("กรุณาเลือกทีม กรอกชื่อ และเลือกประเภทใบ");
  }

  await prisma.g15Card.create({
    data: {
      matchId,
      teamId,
      holderName,
      holderNumber: int(formData, "holderNumber"),
      holderRole: str(formData, "holderRole") ?? "PLAYER",
      cardType,
      minute: int(formData, "minute"),
      reason: str(formData, "reason"),
    },
  });

  revalidateG15(undefined, matchId);
}

export async function updateCard(formData: FormData) {
  await requireAdminOrStaff();
  const id = Number(formData.get("id"));
  const matchId = Number(formData.get("matchId"));
  const teamId = Number(formData.get("teamId"));
  const holderName = String(formData.get("holderName") ?? "").trim();
  const cardType = String(formData.get("cardType") ?? "").trim();

  if (!teamId || !holderName || !cardType) {
    throw new Error("กรุณาเลือกทีม กรอกชื่อ และเลือกประเภทใบ");
  }

  await prisma.g15Card.update({
    where: { id },
    data: {
      teamId,
      holderName,
      holderNumber: int(formData, "holderNumber"),
      holderRole: str(formData, "holderRole") ?? "PLAYER",
      cardType,
      minute: int(formData, "minute"),
      reason: str(formData, "reason"),
    },
  });

  revalidateG15(undefined, matchId);
}

export async function deleteCard(formData: FormData) {
  await requireAdminOrStaff();
  const id = Number(formData.get("id"));
  const matchId = Number(formData.get("matchId"));

  await prisma.g15Card.delete({ where: { id } });

  revalidateG15(undefined, matchId);
}
