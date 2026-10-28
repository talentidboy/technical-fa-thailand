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

// โฟลเดอร์ระดับบนสุดทุกอันใน src/app (รวมในกลุ่ม (admin)) + ไฟล์ใน public — หมวดเหล่านี้ใช้กฎ "ต้องล็อกอินเว้นแต่ระบุว่าเป็นหน้าสาธารณะ"
// ที่อยู่ที่ไม่ขึ้นต้นด้วยหมวดเหล่านี้ไม่มีหน้าอยู่จริง → ปล่อยให้ขึ้นหน้า 404 (ชุดทดสอบ security ตรวจว่ารายการนี้ครบตามโฟลเดอร์จริง)
// เพิ่มหมวดใหม่ใน src/app ต้องเพิ่มชื่อที่นี่ด้วย ไม่งั้นหน้าใหม่จะเปิดได้โดยไม่ต้องล็อกอิน
export const KNOWN_SECTIONS = [
  "",
  "academies",
  "admin",
  "announcements",
  "api",
  "apply",
  "audit",
  "calendar",
  "coach-center",
  "coaches",
  "course-sessions",
  "courses",
  "dashboard",
  "errors",
  "g15",
  "g15-womens-series",
  "grassroots-football",
  "instructors",
  "login",
  "me",
  "news",
  "play-and-learn",
  "register",
  "renewals",
  "reports",
  "requests",
  "settings",
  "setup",
  "talent-id",
  "training-centre",
  "users",
  "verify",
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
    // ทำเนียบอคาเดมี (Academy Licensing) — หน้าจัดการ /academies/manage ต้องล็อกอิน
    pathname === "/academies" ||
    (pathname.startsWith("/academies/") && !pathname.startsWith("/academies/manage")) ||
    // ฟุตบอลรากหญ้า + ศูนย์ข้อมูลและบทความด้านเทคนิค (/training-centre) อ่านได้ทุกคน — หน้าจัดการบทความ /training-centre/manage ต้องล็อกอิน
    pathname === "/grassroots-football" ||
    pathname === "/training-centre" ||
    (pathname.startsWith("/training-centre/") && !pathname.startsWith("/training-centre/manage")) ||
    // ไฟล์ภาพสาธารณะของ G15 ใน public/g15 (เช่น แผนผังสนาม) — ไม่งั้นผู้ชมที่ไม่ได้ล็อกอินจะถูกเด้งไปหน้าเข้าสู่ระบบแทนภาพ
    pathname.startsWith("/g15/") ||
    pathname === "/api/g15/version" ||
    // หน้าแจ้งข้อผิดพลาดส่งรายละเอียดมาบันทึก / เช็กเวอร์ชันเว็บ — ต้องใช้ได้แม้ยังไม่ล็อกอิน
    pathname === "/api/client-error" ||
    pathname === "/api/deploy-id" ||
    // งานอัตโนมัติรายวัน (ตรวจสิทธิ์ด้วย CRON_SECRET ในตัว route เอง)
    pathname === "/api/cron/daily" ||
    // สำหรับเครื่องมือค้นหา (ภาพตัวอย่างลิงก์ /og/*.jpg ผ่านกฎ "หมวดที่ไม่มีหน้า" ด้านล่าง)
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    // พิมพ์ที่อยู่ผิด (หมวดที่ไม่มีในเว็บ) → ให้ขึ้นหน้า "ไม่พบหน้านี้" แทนการเด้งไปหน้าเข้าสู่ระบบ
    !KNOWN_SECTIONS.includes(pathname.split("/")[1] ?? "");

  if (isPublic) return NextResponse.next();

  if (!request.cookies.has("session_token")) {
    // เส้นทางของผู้ฝึกสอน (/me และย่อยๆ) ให้เด้งไปหน้าเข้าสู่ระบบของผู้ฝึกสอนโดยเฉพาะ แยกจากผู้ดูแลระบบ/เจ้าหน้าที่
    const loginPath = pathname === "/me" || pathname.startsWith("/me/") ? "/coach-center/login" : "/login";
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|uploads).*)"],
};
