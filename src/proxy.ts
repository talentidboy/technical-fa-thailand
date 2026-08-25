import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/register", "/setup", "/courses"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/verify/") ||
    pathname.startsWith("/news/") ||
    pathname === "/g15-womens-series" ||
    pathname.startsWith("/g15-womens-series/teams/");

  if (isPublic) return NextResponse.next();

  if (!request.cookies.has("session_token")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
