import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // รหัสเวอร์ชันของการ deploy (ต้องตรงกับ src/lib/deployment.ts) — หน้าที่เปิดค้างไว้จากเวอร์ชันเก่า
  // จะถูกโหลดใหม่ทั้งหน้าอัตโนมัติเมื่อเปลี่ยนหน้า แทนการเรียก Server Action ที่ไม่มีแล้วจนกดบันทึกไม่ได้
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || undefined,
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
  // หัวข้อความด้านความปลอดภัยของทุกหน้า: ห้ามเว็บอื่นฝังหน้าเราใน iframe (กันหลอกกด) · บังคับ HTTPS ·
  // ห้ามเบราว์เซอร์เดาชนิดไฟล์ · ไม่ส่งที่อยู่เต็มไปเว็บอื่น · ปิดกล้อง/ไมค์/ตำแหน่งที่เว็บไม่ได้ใช้
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
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
