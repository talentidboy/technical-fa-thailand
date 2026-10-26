import { Anuphan, Noto_Serif_Thai } from "next/font/google";

// ตัวอักษรของ Academy Licensing — Anuphan: ทรงไม่มีหัว เรียบ ทันสมัย ใช้ทั้งหัวข้อและเนื้อหาทุกหน้าของหมวดนี้ (แยกไฟล์ให้โหลดเฉพาะหมวดนี้)
export const academyFont = Anuphan({ subsets: ["thai", "latin"], weight: ["400", "500", "600", "700"], display: "swap" });

// ตัวมีเชิงแบบใบรับรอง — ใช้เฉพาะสไลด์ Academy บนหน้าแรก (ตราประทับ)
export const academySerif = Noto_Serif_Thai({ subsets: ["thai", "latin"], weight: ["500", "600", "700"], display: "swap" });
