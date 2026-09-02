import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/register", "/setup", "/courses", "/play-and-learn", "/coach-center"];

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
  ];

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/verify/") ||
    pathname.startsWith("/news/") ||
    G15_PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/g15-womens-series/teams/") ||
    pathname.startsWith("/g15-womens-series/matches/");

  if (isPublic) return NextResponse.next();

  if (!request.cookies.has("session_token")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|uploads).*)"],
};
