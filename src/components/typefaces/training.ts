import { IBM_Plex_Sans_Thai, Sriracha } from "next/font/google";

// ศูนย์ข้อมูลและบทความด้านเทคนิค (กระดานแทคติก): ตัวหลักแบบเอกสารเทคนิค + ลายมือปากกาไวท์บอร์ดสำหรับโน้ตบนกระดาน (แยกไฟล์ให้โหลดเฉพาะหมวดนี้)
export const trainingFont = IBM_Plex_Sans_Thai({ subsets: ["thai", "latin"], weight: ["400", "500", "600", "700"], display: "swap" });
export const markerFont = Sriracha({ subsets: ["thai", "latin"], weight: "400", display: "swap" });
