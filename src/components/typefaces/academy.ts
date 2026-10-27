import { Anuphan, Kanit } from "next/font/google";

// ตัวอักษรของ Academy Licensing (แยกไฟล์ให้โหลดเฉพาะหมวดนี้)
// เนื้อหา: Anuphan ทรงไม่มีหัว อ่านง่าย · หัวข้อ: Kanit หนาพิเศษ แบบโปสเตอร์ FAT Level Academy ของสมาคมฯ
export const academyFont = Anuphan({ subsets: ["thai", "latin"], weight: ["400", "500", "600", "700"], display: "swap" });
export const academyPoster = Kanit({ subsets: ["thai", "latin"], weight: ["600", "700", "800"], display: "swap" });
