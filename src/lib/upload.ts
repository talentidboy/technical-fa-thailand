import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const BUCKET = "uploads";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function saveUploadedPhoto(
  file: File | null,
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("รองรับไฟล์รูปภาพ JPEG, PNG หรือ WEBP เท่านั้น");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("ขนาดไฟล์ต้องไม่เกิน 5MB");
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(BUCKET).upload(filename, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    throw new Error(`อัปโหลดรูปไม่สำเร็จ: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}
