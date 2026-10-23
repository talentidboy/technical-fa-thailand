import { Noto_Serif_Thai } from "next/font/google";

// ตัวหัวข้อของ Academy Licensing — ตัวมีเชิงแบบใบรับรอง/ทะเบียนทางการ (แยกไฟล์ให้โหลดเฉพาะหมวดนี้)
export const academySerif = Noto_Serif_Thai({ subsets: ["thai", "latin"], weight: ["500", "600", "700"], display: "swap" });
