import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/setup",
  "/courses",
  "/play-and-learn",
  "/coach-center",
  "/coach-center/login",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // หน้าย่อยสาธารณะของ G15 (ไม่รวม /g15-womens-series/manage ซึ่งต้องล็อกอิน)
  const G15_PUBLIC_PATHS = [
    "/g15-womens-series",
    "/g15-womens-series/matches",
    "/g15-womens-series/standings",
    "/g15-womens-series/stats",
    "/g15-womens-series/teams",
    "/g15-womens-series/stadium",
    "/g15-womens-series/gallery",
    "/g15-womens-series/awards",
  ];

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/verify/") ||
    // หน้าสมัครอบรมของแต่ละรุ่น — คนที่ยังไม่มีบัญชีสมัคร + สร้างบัญชีได้ในฟอร์มเดียว
    pathname.startsWith("/apply/") ||
    pathname.startsWith("/news/") ||
    G15_PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/g15-womens-series/teams/") ||
    pathname.startsWith("/g15-womens-series/matches/") ||
    pathname.startsWith("/g15-womens-series/players/") ||
    // ไฟล์ภาพสาธารณะของ G15 ใน public/g15 (เช่น แผนผังสนาม) — ไม่งั้นผู้ชมที่ไม่ได้ล็อกอินจะถูกเด้งไปหน้าเข้าสู่ระบบแทนภาพ
    pathname.startsWith("/g15/") ||
    pathname === "/api/g15/version" ||
    // หน้าแจ้งข้อผิดพลาดส่งรายละเอียดมาบันทึก / เช็กเวอร์ชันเว็บ — ต้องใช้ได้แม้ยังไม่ล็อกอิน
    pathname === "/api/client-error" ||
    pathname === "/api/deploy-id" ||
    // งานอัตโนมัติรายวัน (ตรวจสิทธิ์ด้วย CRON_SECRET ในตัว route เอง)
    pathname === "/api/cron/daily";

  if (isPublic) return NextResponse.next();

  if (!request.cookies.has("session_token")) {
    // เส้นทางของผู้ฝึกสอน (/me และย่อยๆ) ให้เด้งไปหน้าเข้าสู่ระบบของผู้ฝึกสอนโดยเฉพาะ แยกจากผู้ดูแลระบบ/เจ้าหน้าที่
    const loginPath = pathname === "/me" || pathname.startsWith("/me/") ? "/coach-center/login" : "/login";
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|uploads).*)"],
};
