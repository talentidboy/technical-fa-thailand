"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { saveUploadedPdf, saveUploadedPhoto } from "@/lib/upload";
import { videoEmbed } from "@/lib/g15-video";
import { DEFAULT_PASSPORT, PL_KINDS, PL_SETTING_DEFAULTS, PL_SETTING_KEYS, isRequired, type PlField, type PlKind } from "@/lib/play-and-learn";

export type PlResult = { ok: true } | { ok: false; error: string };

async function requireAdminOrStaff() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    throw new Error("เฉพาะผู้ดูแลระบบและเจ้าหน้าที่เท่านั้นที่ทำรายการนี้ได้");
  }
  return user;
}

async function attempt(fn: () => Promise<void>): Promise<PlResult> {
  try {
    await requireAdminOrStaff();
    await fn();
    revalidatePath("/play-and-learn");
    revalidatePath("/play-and-learn/manage");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ" };
  }
}

// textarea ส่งการขึ้นบรรทัดมาเป็น \r\n — เก็บเป็น \n
const text = (fd: FormData, key: string) =>
  String(fd.get(key) ?? "")
    .replace(/\r\n?/g, "\n")
    .trim();
const optional = (fd: FormData, key: string) => text(fd, key) || null;
const file = (fd: FormData, key: string) => {
  const f = fd.get(key);
  return f instanceof File && f.size > 0 ? f : null;
};

function checkUrl(value: string | null, label: string) {
  if (value && !/^https?:\/\/\S+$/i.test(value)) throw new Error(`${label}ต้องขึ้นต้นด้วย http:// หรือ https://`);
  return value;
}

// ===================== ศูนย์ฝึก =====================
async function readCenterFields(formData: FormData, current?: { imageUrl: string | null }) {
  const name = text(formData, "name");
  const province = text(formData, "province");
  const provinceEn = text(formData, "provinceEn");
  const address = text(formData, "address");
  const coordinator = text(formData, "coordinator");
  const tel = text(formData, "tel");
  if (!name || !province || !provinceEn || !address || !coordinator || !tel) {
    throw new Error("กรุณากรอกชื่อศูนย์ จังหวัด ที่อยู่ ผู้ประสานงาน และเบอร์โทรให้ครบ");
  }
  const uploaded = await saveUploadedPhoto(file(formData, "image"));
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  return {
    name,
    province,
    provinceEn,
    address,
    coaches: text(formData, "coaches"),
    coordinator,
    tel,
    schedule: optional(formData, "schedule"),
    registerUrl: checkUrl(optional(formData, "registerUrl"), "ลิงก์รับสมัคร"),
    mapUrl: checkUrl(optional(formData, "mapUrl"), "ลิงก์แผนที่"),
    imageUrl: uploaded ?? (formData.get("removeImage") === "on" ? null : (current?.imageUrl ?? null)),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  };
}

export async function createCenter(formData: FormData) {
  return attempt(async () => {
    await prisma.playAndLearnCenter.create({ data: await readCenterFields(formData) });
  });
}

export async function updateCenter(formData: FormData) {
  return attempt(async () => {
    const id = Number(formData.get("id"));
    const current = await prisma.playAndLearnCenter.findUnique({ where: { id }, select: { imageUrl: true } });
    if (!current) throw new Error("ไม่พบศูนย์ฝึกที่ต้องการแก้ไข");
    await prisma.playAndLearnCenter.update({ where: { id }, data: await readCenterFields(formData, current) });
  });
}

export async function deleteCenter(formData: FormData) {
  return attempt(async () => {
    await prisma.playAndLearnCenter.deleteMany({ where: { id: Number(formData.get("id")) } });
  });
}

// ===================== ข้อความ / ช่องทางติดต่อ =====================
// ปล่อยช่องว่าง (หรือตรงกับข้อความเดิม) = ใช้ข้อความเริ่มต้น ไม่เก็บในฐานข้อมูล
export async function saveSettings(formData: FormData) {
  return attempt(async () => {
    const ops = [];
    for (const key of PL_SETTING_KEYS) {
      if (!formData.has(key)) continue;
      const value = text(formData, key);
      if ((key === "lineUrl" || key === "facebookUrl") && value) checkUrl(value, key === "lineUrl" ? "ลิงก์ LINE " : "ลิงก์ Facebook ");
      if (key === "contactEmail" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error("อีเมลติดต่อไม่ถูกต้อง");
      ops.push(
        !value || value === PL_SETTING_DEFAULTS[key]
          ? prisma.playAndLearnSetting.deleteMany({ where: { key } })
          : prisma.playAndLearnSetting.upsert({ where: { key }, create: { key, value }, update: { value } }),
      );
    }
    await prisma.$transaction(ops);
  });
}

// ===================== เนื้อหา (กิจกรรม / แกลเลอรี / วิดีโอ / FAQ / เสียงผู้ปกครอง / พาร์ทเนอร์ / พาสปอร์ต) =====================
async function readItem(kind: PlKind, formData: FormData, current?: { imageUrl: string | null; url: string | null }) {
  const fields = PL_KINDS[kind].fields as Partial<Record<PlField, string>>;
  const dateRaw = text(formData, "date");
  const image = await saveUploadedPhoto(file(formData, "image"));
  const pdf = kind === "PASSPORT" ? await saveUploadedPdf(file(formData, "pdf")) : null;
  const data = {
    title: text(formData, "title"),
    body: fields.body ? optional(formData, "body") : null,
    extra: fields.extra ? optional(formData, "extra") : null,
    url: pdf ?? (fields.url ? checkUrl(optional(formData, "url"), "ลิงก์") : null),
    date: fields.date && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? new Date(`${dateRaw}T00:00:00+07:00`) : null,
    imageUrl: fields.imageUrl ? (image ?? (formData.get("removeImage") === "on" ? null : (current?.imageUrl ?? null))) : null,
  };
  for (const f of Object.keys(fields) as PlField[]) {
    if (!isRequired(kind, f)) continue;
    if (!data[f]) throw new Error(`กรุณากรอก${fields[f]!.replace(" *", "")}`);
  }
  if (kind === "VIDEO" && !videoEmbed(data.url)) throw new Error("ลิงก์วิดีโอต้องเป็น YouTube หรือ Facebook");
  return data;
}

function kindOf(formData: FormData): PlKind {
  const kind = text(formData, "kind") as PlKind;
  if (!(kind in PL_KINDS)) throw new Error("ประเภทเนื้อหาไม่ถูกต้อง");
  return kind;
}

export async function createItem(formData: FormData) {
  return attempt(async () => {
    const kind = kindOf(formData);
    const data = await readItem(kind, formData);
    // รายการใหม่ต่อท้ายเสมอ — เปลี่ยนลำดับด้วยปุ่มเลื่อนขึ้น/ลง
    const last = await prisma.playAndLearnItem.aggregate({ where: { kind }, _max: { sortOrder: true } });
    await prisma.playAndLearnItem.create({ data: { kind, ...data, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
  });
}

export async function updateItem(formData: FormData) {
  return attempt(async () => {
    const id = Number(formData.get("id"));
    const current = await prisma.playAndLearnItem.findUnique({ where: { id } });
    if (!current) throw new Error("ไม่พบรายการ");
    await prisma.playAndLearnItem.update({ where: { id }, data: await readItem(current.kind as PlKind, formData, current) });
  });
}

export async function deleteItem(formData: FormData) {
  return attempt(async () => {
    await prisma.playAndLearnItem.deleteMany({ where: { id: Number(formData.get("id")) } });
  });
}

export async function togglePublished(formData: FormData) {
  return attempt(async () => {
    const id = Number(formData.get("id"));
    const item = await prisma.playAndLearnItem.findUnique({ where: { id }, select: { published: true } });
    if (item) await prisma.playAndLearnItem.update({ where: { id }, data: { published: !item.published } });
  });
}

// เลื่อนขึ้น/ลง (สลับลำดับกับรายการข้างเคียงในประเภทเดียวกัน)
export async function moveItem(formData: FormData) {
  return attempt(async () => {
    const id = Number(formData.get("id"));
    const dir = text(formData, "dir") === "up" ? -1 : 1;
    const item = await prisma.playAndLearnItem.findUnique({ where: { id } });
    if (!item) return;
    const list = await prisma.playAndLearnItem.findMany({ where: { kind: item.kind }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
    const i = list.findIndex((x) => x.id === id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    // จัดลำดับใหม่เป็น 1..n แล้วสลับ — กันกรณีลำดับซ้ำกัน
    const order = list.map((x) => x.id);
    [order[i], order[j]] = [order[j], order[i]];
    await prisma.$transaction(order.map((itemId, idx) => prisma.playAndLearnItem.update({ where: { id: itemId }, data: { sortOrder: idx + 1 } })));
  });
}

// อัปโหลดรูปแกลเลอรีทีละรูป (หน้าจัดการส่งมาทีละไฟล์ — ไม่เกินขีดจำกัดต่อครั้ง)
export async function addPhoto(formData: FormData) {
  return attempt(async () => {
    const imageUrl = await saveUploadedPhoto(file(formData, "image"));
    if (!imageUrl) throw new Error("ไม่พบไฟล์รูป");
    const last = await prisma.playAndLearnItem.aggregate({ where: { kind: "PHOTO" }, _max: { sortOrder: true } });
    await prisma.playAndLearnItem.create({
      data: { kind: "PHOTO", title: text(formData, "title"), extra: optional(formData, "extra"), imageUrl, sortOrder: (last._max.sortOrder ?? 0) + 1 },
    });
  });
}

// นำ 8 บทพาสปอร์ตเดิมเข้ามาให้แก้ไขได้ (เฉพาะตอนที่ยังไม่มีบทในฐานข้อมูล)
export async function importDefaultPassport() {
  return attempt(async () => {
    if (await prisma.playAndLearnItem.count({ where: { kind: "PASSPORT" } })) throw new Error("มีบทพาสปอร์ตในระบบแล้ว");
    await prisma.playAndLearnItem.createMany({ data: DEFAULT_PASSPORT.map((p, i) => ({ kind: "PASSPORT", title: p.title, extra: p.extra, url: p.url, sortOrder: i + 1 })) });
  });
}
