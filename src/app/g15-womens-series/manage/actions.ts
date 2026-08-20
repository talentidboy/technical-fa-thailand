"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { saveUploadedPhoto } from "@/lib/upload";
import { revalidatePath } from "next/cache";

async function requireAdminOrStaff() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    throw new Error("เฉพาะผู้ดูแลระบบและเจ้าหน้าที่เท่านั้นที่ทำรายการนี้ได้");
  }
  return user;
}

function revalidateG15() {
  revalidatePath("/g15-womens-series");
  revalidatePath("/g15-womens-series/manage");
}

export async function createTeam(formData: FormData) {
  await requireAdminOrStaff();

  const name = String(formData.get("name") ?? "").trim();
  const groupName = String(formData.get("groupName") ?? "").trim();

  if (!name) {
    throw new Error("กรุณากรอกชื่อทีม");
  }

  const logoUrl = await saveUploadedPhoto(formData.get("logo") as File | null);

  await prisma.g15Team.create({
    data: {
      name,
      groupName: groupName || null,
      logoUrl,
    },
  });

  revalidateG15();
}

export async function deleteTeam(formData: FormData) {
  await requireAdminOrStaff();
  const id = Number(formData.get("id"));

  await prisma.g15Team.delete({ where: { id } });

  revalidateG15();
}

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
      matchDate: matchDateRaw ? new Date(matchDateRaw) : null,
      homeTeamId,
      awayTeamId,
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

export async function recordMatchResult(formData: FormData) {
  await requireAdminOrStaff();

  const id = Number(formData.get("id"));
  const homeScore = Number(formData.get("homeScore"));
  const awayScore = Number(formData.get("awayScore"));

  if (
    !Number.isFinite(homeScore) ||
    !Number.isFinite(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {
    throw new Error("กรุณากรอกผลการแข่งขันเป็นตัวเลขไม่ติดลบ");
  }

  await prisma.g15Match.update({
    where: { id },
    data: { homeScore, awayScore, status: "FINISHED" },
  });

  revalidateG15();
}
