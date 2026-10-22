import { NextResponse } from "next/server";
import { DEPLOYMENT_ID } from "@/lib/deployment";

// เวอร์ชันของเว็บที่กำลังให้บริการ — หน้าเว็บที่เปิดค้างไว้ใช้เช็กว่ามีการอัปเดตระบบหรือยัง
export function GET() {
  return NextResponse.json({ id: DEPLOYMENT_ID }, { headers: { "Cache-Control": "no-store" } });
}
