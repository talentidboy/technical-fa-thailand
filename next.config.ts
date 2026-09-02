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
