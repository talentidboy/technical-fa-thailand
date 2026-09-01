"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdminOrStaff() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    throw new Error("เฉพาะผู้ดูแลระบบและเจ้าหน้าที่เท่านั้นที่ทำรายการนี้ได้");
  }
  return user;
}

function revalidate() {
  revalidatePath("/play-and-learn");
  revalidatePath("/play-and-learn/manage");
}

function readCenterFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const provinceEn = String(formData.get("provinceEn") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const coaches = String(formData.get("coaches") ?? "").trim();
  const coordinator = String(formData.get("coordinator") ?? "").trim();
  const tel = String(formData.get("tel") ?? "").trim();
  const schedule = String(formData.get("schedule") ?? "").trim();
  const registerUrl = String(formData.get("registerUrl") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (!name || !province || !provinceEn || !address || !coordinator || !tel) {
    throw new Error("กรุณากรอกชื่อศูนย์ จังหวัด ที่อยู่ ผู้ประสานงาน และเบอร์โทรให้ครบ");
  }

  return {
    name,
    province,
    provinceEn,
    address,
    coaches,
    coordinator,
    tel,
    schedule: schedule || null,
    registerUrl: registerUrl || null,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  };
}

export async function createCenter(formData: FormData) {
  await requireAdminOrStaff();
  const data = readCenterFields(formData);
  await prisma.playAndLearnCenter.create({ data });
  revalidate();
}

export async function updateCenter(formData: FormData) {
  await requireAdminOrStaff();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) throw new Error("ไม่พบศูนย์ฝึกที่ต้องการแก้ไข");
  const data = readCenterFields(formData);
  await prisma.playAndLearnCenter.update({ where: { id }, data });
  revalidate();
}

export async function deleteCenter(formData: FormData) {
  await requireAdminOrStaff();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) throw new Error("ไม่พบศูนย์ฝึกที่ต้องการลบ");
  await prisma.playAndLearnCenter.delete({ where: { id } });
  revalidate();
}
