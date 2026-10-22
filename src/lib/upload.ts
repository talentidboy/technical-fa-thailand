import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const BUCKET = "uploads";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
// ต้องไม่เกิน experimental.serverActions.bodySizeLimit (4mb) ใน next.config.ts — รูปใหญ่กว่านี้ถูกย่อในเบราว์เซอร์ก่อน (lib/image-shrink.ts)
const MAX_SIZE_BYTES = 4 * 1024 * 1024;

// สร้างตอนอัปโหลดจริงเท่านั้น — ถ้าสร้างตอนโหลดไฟล์ หน้าที่ import ไฟล์นี้จะพังทั้งหน้าเมื่อไม่มีค่า env (เช่นตอน build บน CI)
let client: ReturnType<typeof createClient> | null = null;
function storage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("ระบบอัปโหลดรูปยังไม่ได้ตั้งค่า (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  client ??= createClient(url, key);
  return client.storage.from(BUCKET);
}

// ไฟล์ PDF (เช่น พาสปอร์ต Play and Learn) — ขนาดไม่เกิน 4MB เท่ากับรูป
export async function saveUploadedPdf(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.type !== "application/pdf") throw new Error("รองรับเฉพาะไฟล์ PDF");
  if (file.size > MAX_SIZE_BYTES) throw new Error("ไฟล์ PDF ต้องไม่เกิน 4MB — ไฟล์ใหญ่กว่านี้ให้วางลิงก์แทน");
  const filename = `play-and-learn-${crypto.randomUUID()}.pdf`;
  const { error } = await storage().upload(filename, Buffer.from(await file.arrayBuffer()), { contentType: "application/pdf", upsert: false });
  if (error) throw new Error(`อัปโหลดไฟล์ไม่สำเร็จ: ${error.message}`);
  return storage().getPublicUrl(filename).data.publicUrl;
}

export async function saveUploadedPhoto(
  file: File | null,
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("รองรับไฟล์รูปภาพ JPEG, PNG หรือ WEBP เท่านั้น");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("ขนาดไฟล์ต้องไม่เกิน 4MB");
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await storage().upload(filename, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    throw new Error(`อัปโหลดรูปไม่สำเร็จ: ${error.message}`);
  }

  const { data } = storage().getPublicUrl(filename);
  return data.publicUrl;
}
