import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

// เอกสารของอคาเดมี (งบประมาณ สัญญาจ้าง นโยบาย ฯลฯ) — เก็บในที่เก็บส่วนตัว ไม่มีลิงก์สาธารณะ
// เปิดได้ผ่าน /academies/docs/[id] เท่านั้น (ตรวจสิทธิ์ก่อน แล้วส่งลิงก์ชั่วคราว 60 วินาที)
// ต้องตั้ง SUPABASE_SERVICE_ROLE_KEY (ฝั่งเซิร์ฟเวอร์เท่านั้น) · ชุดทดสอบใช้ ACADEMY_DOCS_DIR (โฟลเดอร์ในเครื่อง) แทน

const BUCKET = "academy-docs";
const MAX_BYTES = 4 * 1024 * 1024; // เท่าขีดจำกัด Server Action

export const DOC_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};
export const DOC_ACCEPT = Object.keys(DOC_TYPES).join(",");

// โฟลเดอร์ในเครื่องใช้เฉพาะตอนทดสอบ — turbopackIgnore กันไม่ให้ build ลากไฟล์ทั้งโปรเจกต์เข้าไปในฟังก์ชัน
const localDir = () => process.env.ACADEMY_DOCS_DIR || null;
export const docsEnabled = () => !!localDir() || !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

let client: ReturnType<typeof createClient> | null = null;
function bucket() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("ระบบแนบเอกสารยังไม่พร้อมใช้งาน — รอผู้ดูแลระบบตั้งค่า");
  client ??= createClient(url, key, { auth: { persistSession: false } });
  return client.storage;
}

export type StoredDocument = { fileKey: string; fileName: string; mime: string; size: number };

export async function storeDocument(file: File, academyId: number): Promise<StoredDocument> {
  const ext = DOC_TYPES[file.type];
  if (!ext) throw new Error("รองรับไฟล์ PDF, รูปภาพ (JPG/PNG/WEBP), Word และ Excel เท่านั้น");
  if (file.size > MAX_BYTES) throw new Error("ไฟล์ต้องไม่เกิน 4MB — ถ้าไฟล์ใหญ่ ให้แยกเป็นหลายไฟล์หรือบีบอัด PDF");
  const fileKey = `${academyId}/${crypto.randomUUID()}.${ext}`;
  const body = Buffer.from(await file.arrayBuffer());
  const dir = localDir();
  if (dir) {
    await fs.mkdir(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ dir, String(academyId)), { recursive: true });
    await fs.writeFile(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ dir, fileKey), body);
  } else {
    const upload = () => bucket().from(BUCKET).upload(fileKey, body, { contentType: file.type, upsert: false });
    let { error } = await upload();
    // ครั้งแรกยังไม่มีที่เก็บ → สร้างแบบส่วนตัว (public: false) แล้วอัปโหลดใหม่
    if (error && /not found/i.test(error.message)) {
      await bucket().createBucket(BUCKET, { public: false });
      ({ error } = await upload());
    }
    if (error) throw new Error(`อัปโหลดเอกสารไม่สำเร็จ: ${error.message}`);
  }
  return { fileKey, fileName: file.name.slice(0, 200) || `document.${ext}`, mime: file.type, size: file.size };
}

// ส่งไฟล์ให้ผู้ที่ผ่านการตรวจสิทธิ์แล้ว
export async function documentResponse(doc: { fileKey: string; fileName: string; mime: string }): Promise<Response> {
  const dir = localDir();
  if (dir) {
    const data = await fs.readFile(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ dir, doc.fileKey));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": doc.mime,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
        "Cache-Control": "private, no-store",
      },
    });
  }
  const { data, error } = await bucket().from(BUCKET).createSignedUrl(doc.fileKey, 60, { download: doc.fileName });
  if (error || !data) throw new Error("เปิดเอกสารไม่สำเร็จ");
  return Response.redirect(data.signedUrl, 302);
}

export async function removeStoredDocument(fileKey: string) {
  const dir = localDir();
  try {
    if (dir) await fs.unlink(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ dir, fileKey));
    else await bucket().from(BUCKET).remove([fileKey]);
  } catch {
    // ไฟล์หายไปแล้ว — ลบรายการในฐานข้อมูลต่อได้
  }
}
