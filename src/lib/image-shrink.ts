// ย่อรูปฝั่งเบราว์เซอร์ก่อนอัปโหลด — รูปถ่ายจากมือถือ (4–12MB) เกินขีดจำกัดของ Server Action (4MB ใน next.config.ts)
// รูปไม่ใหญ่ (≤ 1.5MB) ไม่แตะ · JPEG → JPEG · PNG/WebP → WebP (เก็บพื้นหลังโปร่งใสของโลโก้/รูปตัดพื้นไว้)

export const UPLOAD_LIMIT_BYTES = 4 * 1024 * 1024;
const SHRINK_OVER_BYTES = 1.5 * 1024 * 1024;
const MAX_SIDE = 2000;

export function needsShrink(file: File) {
  return /^image\/(jpeg|png|webp)$/.test(file.type) && file.size > SHRINK_OVER_BYTES;
}

export async function shrinkImage(file: File): Promise<File> {
  if (!needsShrink(file)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const wanted = file.type === "image/jpeg" ? "image/jpeg" : "image/webp";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, wanted, 0.86));
    // เบราว์เซอร์บางตัวเข้ารหัส WebP ไม่ได้ (ได้ PNG กลับมา) — ใช้ชนิดที่ได้จริง และใช้ไฟล์เดิมถ้าไม่เล็กลง
    if (!blob || blob.size >= file.size) return file;
    const ext = blob.type === "image/jpeg" ? "jpg" : blob.type === "image/webp" ? "webp" : "png";
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${ext}`, { type: blob.type, lastModified: Date.now() });
  } catch {
    return file;
  }
}
