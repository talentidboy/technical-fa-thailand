import { NextResponse, type NextRequest } from "next/server";
import { logError } from "@/lib/error-log";

// หน้าแจ้งข้อผิดพลาด (error.tsx / global-error.tsx) ส่งรายละเอียดมาที่นี่ — เปิดสาธารณะ จึงจำกัดขนาดและตัดข้อความ
export async function POST(request: NextRequest) {
  try {
    const text = await request.text();
    if (text.length > 10_000) return new NextResponse(null, { status: 413 });
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
