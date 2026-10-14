import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // geothai อ่านไฟล์ข้อมูล (geo.json ฯลฯ) ด้วย fs.readFileSync แบบคำนวณ path เอง
  // ทำให้ตัว file tracer ของ Vercel ตามไม่เจอและไม่รวมไฟล์เหล่านี้เข้าไปใน serverless bundle โดยอัตโนมัติ — ต้องบังคับรวมเอง
  outputFileTracingIncludes: {
    "/*": ["./node_modules/geothai/dist/data/**/*"],
    // แบบใบประกาศ AFC + โลโก้ + ฟอนต์ ที่อ่านด้วย fs ตอนสร้าง PDF ใบประกาศ
    "/me/certificate/**": ["./src/assets/certificates/**/*", "./node_modules/@fontsource/noto-sans-thai/files/*.woff"],
    "/coaches/**": ["./src/assets/certificates/**/*", "./node_modules/@fontsource/noto-sans-thai/files/*.woff"],
    "/course-sessions/**": ["./src/assets/certificates/**/*", "./node_modules/@fontsource/noto-sans-thai/files/*.woff"],
  },
  // อัปโหลดรูปผ่าน Server Action (โลโก้ทีม/รูปนักกีฬา G15 ฯลฯ) — ค่าเริ่มต้น 1MB เล็กเกินสำหรับรูปถ่ายจากมือถือ
  // ตั้งไว้ 4MB (ต่ำกว่าขีดจำกัด request body 4.5MB ของ Vercel Functions)
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "rgqahrqwxwhaechiodzf.supabase.co",
      },
    ],
  },
};

export default nextConfig;
