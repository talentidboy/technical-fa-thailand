import { NextResponse, type NextRequest } from "next/server";
import { logError } from "@/lib/error-log";
import { prisma } from "@/lib/prisma";

// หน้าแจ้งข้อผิดพลาด (error.tsx / global-error.tsx) ส่งรายละเอียดมาที่นี่ — เปิดสาธารณะ จึงจำกัดขนาดและตัดข้อความ
export async function POST(request: NextRequest) {
  try {
    const text = await request.text();
    if (text.length > 10_000) return new NextResponse(null, { status: 413 });
    // กันการยิงข้อความสุ่มมาถมฐานข้อมูล/อีเมลแจ้งเตือน: รับรายการใหม่จากหน้าเว็บไม่เกิน 30 รายการต่อ 10 นาที
    const recent = await prisma.errorLog.count({ where: { source: "CLIENT", firstSeenAt: { gte: new Date(Date.now() - 600_000) } } });
    if (recent >= 30) return new NextResponse(null, { status: 429 });
    const body = JSON.parse(text) as { message?: unknown; digest?: unknown; path?: unknown; stack?: unknown };
    const str = (v: unknown) => (typeof v === "string" ? v : null);
    await logError({
      source: "CLIENT",
      message: str(body.message) ?? "(ไม่มีข้อความ)",
      digest: str(body.digest),
      path: str(body.path),
      stack: str(body.stack),
      userAgent: request.headers.get("user-agent"),
    });
  } catch {
    // ข้อมูลไม่ถูกต้อง — ไม่ต้องทำอะไร
  }
  return new NextResponse(null, { status: 204 });
}
