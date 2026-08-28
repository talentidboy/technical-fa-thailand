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

// เพิ่มผู้ทำประตูหลายคนพร้อมกันจากแถวในหน้าเดียว (ไม่ต้องเปิด modal ทีละคน) — แต่ละแถวต้องเลือกนักกีฬาจากทะเบียน
// (ไลน์อัพของนัดนั้นถ้ามี ไม่งั้นทั้งทีม) แถวไหนไม่ได้เลือกนักกีฬาจะถูกข้ามไปเฉยๆ ไม่ error
export async function createGoalsBulk(formData: FormData) {
  await requireAdminOrStaff();
  const matchId = Number(formData.get("matchId"));
  if (!matchId) throw new Error("ไม่พบนัดการแข่งขัน");

  const rows: { playerId: number; minute: number | null }[] = [];
  let i = 0;
  while (formData.has(`playerId_${i}`)) {
    const playerId = int(formData, `playerId_${i}`);
    if (playerId) rows.push({ playerId, minute: int(formData, `minute_${i}`) });
    i++;
  }

  if (rows.length > 0) {
    const players = await prisma.g15Player.findMany({ where: { id: { in: rows.map((r) => r.playerId) } } });
    const playerById = new Map(players.map((p) => [p.id, p]));
    const data = rows.flatMap((r) => {
      const p = playerById.get(r.playerId);
      if (!p) return [];
      return [
        {
          matchId,
          teamId: p.teamId,
          playerId: p.id,
          playerName: `${p.firstNameTh} ${p.lastNameTh}`,
          jerseyNumber: p.jerseyNumber,
          minute: r.minute,
        },
      ];
    });
    if (data.length > 0) await prisma.g15Goal.createMany({ data });
  }

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

// เพิ่มการเปลี่ยนตัวหลายรายการพร้อมกัน — เข้า/ออก เลือกจากทะเบียนนักกีฬาทั้งคู่ ไม่ใช่กรอกชื่อเอง
export async function createSubstitutionsBulk(formData: FormData) {
  await requireAdminOrStaff();
  const matchId = Number(formData.get("matchId"));
  if (!matchId) throw new Error("ไม่พบนัดการแข่งขัน");

  const rows: { inId: number; outId: number; minute: number | null }[] = [];
  let i = 0;
  while (formData.has(`inPlayerId_${i}`)) {
    const inId = int(formData, `inPlayerId_${i}`);
    const outId = int(formData, `outPlayerId_${i}`);
    if (inId && outId) rows.push({ inId, outId, minute: int(formData, `minute_${i}`) });
    i++;
  }

  if (rows.length > 0) {
    const ids = Array.from(new Set(rows.flatMap((r) => [r.inId, r.outId])));
    const players = await prisma.g15Player.findMany({ where: { id: { in: ids } } });
    const playerById = new Map(players.map((p) => [p.id, p]));
    const data = rows.flatMap((r) => {
      const pin = playerById.get(r.inId);
      const pout = playerById.get(r.outId);
      if (!pin || !pout) return [];
      return [
        {
          matchId,
          teamId: pin.teamId,
          minute: r.minute,
          playerInName: `${pin.firstNameTh} ${pin.lastNameTh}`,
          playerInNumber: pin.jerseyNumber,
          playerOutName: `${pout.firstNameTh} ${pout.lastNameTh}`,
          playerOutNumber: pout.jerseyNumber,
        },
      ];
    });
    if (data.length > 0) await prisma.g15Substitution.createMany({ data });
  }

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

// เพิ่มใบเหลือง/ใบแดงหลายใบพร้อมกัน — เลือกผู้รับจากทะเบียนนักกีฬาหรือเจ้าหน้าที่ทีม
// ค่า holder_i เข้ารหัสเป็น "player:<id>" หรือ "official:<id>" เพื่อรู้ว่าจะ query ตารางไหน
export async function createCardsBulk(formData: FormData) {
  await requireAdminOrStaff();
  const matchId = Number(formData.get("matchId"));
  if (!matchId) throw new Error("ไม่พบนัดการแข่งขัน");

  const rows: { holder: string; cardType: string; minute: number | null; reason: string | null }[] = [];
  let i = 0;
  while (formData.has(`holder_${i}`)) {
    const holder = String(formData.get(`holder_${i}`) ?? "").trim();
    const cardType = String(formData.get(`cardType_${i}`) ?? "").trim();
    if (holder && cardType) {
      rows.push({ holder, cardType, minute: int(formData, `minute_${i}`), reason: str(formData, `reason_${i}`) });
    }
    i++;
  }

  if (rows.length > 0) {
    const playerIds = rows.filter((r) => r.holder.startsWith("player:")).map((r) => Number(r.holder.slice(7)));
    const officialIds = rows.filter((r) => r.holder.startsWith("official:")).map((r) => Number(r.holder.slice(9)));
    const [players, officials] = await Promise.all([
      playerIds.length ? prisma.g15Player.findMany({ where: { id: { in: playerIds } } }) : Promise.resolve([]),
      officialIds.length ? prisma.g15Official.findMany({ where: { id: { in: officialIds } } }) : Promise.resolve([]),
    ]);
    const playerById = new Map(players.map((p) => [p.id, p]));
    const officialById = new Map(officials.map((o) => [o.id, o]));

    const data = rows.flatMap((r) => {
      if (r.holder.startsWith("player:")) {
        const p = playerById.get(Number(r.holder.slice(7)));
        if (!p) return [];
        return [
          {
            matchId,
            teamId: p.teamId,
            holderName: `${p.firstNameTh} ${p.lastNameTh}`,
            holderNumber: p.jerseyNumber,
            holderRole: "PLAYER",
            cardType: r.cardType,
            minute: r.minute,
            reason: r.reason,
          },
        ];
      }
      if (r.holder.startsWith("official:")) {
        const o = officialById.get(Number(r.holder.slice(9)));
        if (!o) return [];
        return [
          {
            matchId,
            teamId: o.teamId,
            holderName: `${o.firstNameTh} ${o.lastNameTh}`,
            holderNumber: null,
            holderRole: "OFFICIAL",
            cardType: r.cardType,
            minute: r.minute,
            reason: r.reason,
          },
        ];
      }
      return [];
    });
    if (data.length > 0) await prisma.g15Card.createMany({ data });
  }

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

// ===== ไลน์อัพ =====
// เช็กบ็อกซ์เดียวครอบคลุมนักกีฬาทั้งสองทีม บันทึกครั้งเดียว — แทนที่ไลน์อัพเดิมของนัดนี้ทั้งหมดด้วยค่าที่ส่งมา
export async function updateLineup(formData: FormData) {
  await requireAdminOrStaff();
  const matchId = Number(formData.get("matchId"));
  if (!matchId) throw new Error("ไม่พบนัดการแข่งขัน");

  const match = await prisma.g15Match.findUnique({
    where: { id: matchId },
    select: { homeTeamId: true, awayTeamId: true },
  });
  if (!match) throw new Error("ไม่พบนัดการแข่งขัน");

  // ดึงรายชื่อนักกีฬาของทั้งสองทีมจากฐานข้อมูลเอง ไม่เชื่อ playerId ที่ส่งมาจากฟอร์ม
  const players = await prisma.g15Player.findMany({
    where: { teamId: { in: [match.homeTeamId, match.awayTeamId] } },
    select: { id: true, teamId: true },
  });

  const statusByPlayerId = new Map<number, string>();
  for (const p of players) {
    const status = String(formData.get(`status_${p.id}`) ?? "");
    if (status === "STARTING" || status === "SUBSTITUTE") statusByPlayerId.set(p.id, status);
  }

  // กัปตันเลือกทีละคนต่อทีม (select เดียว ไม่ใช่ checkbox แยกต่อผู้เล่น) — บังคับว่าต้องเป็นคนที่ตั้งสถานะตัวจริงไว้ในฟอร์มเดียวกันนี้เท่านั้น
  const captainByTeamId = new Map<number, number>();
  for (const teamId of [match.homeTeamId, match.awayTeamId]) {
    const raw = String(formData.get(`captainPlayerId_${teamId}`) ?? "");
    if (!raw) continue;
    const captainId = Number(raw);
    if (statusByPlayerId.get(captainId) !== "STARTING") {
      throw new Error("กัปตันต้องเป็นผู้เล่นตัวจริงเท่านั้น กรุณาตั้งสถานะ \"ตัวจริง\" ให้ผู้เล่นคนนั้นก่อนบันทึก");
    }
    captainByTeamId.set(teamId, captainId);
  }

  const rows = players.flatMap((p) => {
    const status = statusByPlayerId.get(p.id);
    if (!status) return [];
    return [
      {
        matchId,
        teamId: p.teamId,
        playerId: p.id,
        status,
        isCaptain: captainByTeamId.get(p.teamId) === p.id,
      },
    ];
  });

  await prisma.$transaction([
    prisma.g15Lineup.deleteMany({ where: { matchId } }),
    ...(rows.length > 0 ? [prisma.g15Lineup.createMany({ data: rows })] : []),
  ]);

  revalidateG15(undefined, matchId);
}
