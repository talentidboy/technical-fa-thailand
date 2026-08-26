import Link from "next/link";
import Image from "next/image";
import { LOGO_URL } from "@/lib/brand";
import { ArrowLeft, Settings, LogIn } from "lucide-react";

export function G15Header({ user }: { user: { role: string } | null }) {
  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-rose-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
        <Link href="/g15-womens-series" className="flex min-w-0 items-center gap-2">
          <Image
            src={LOGO_URL}
            alt="FA Thailand"
            width={36}
            height={36}
            className="h-9 w-9 flex-none rounded-lg object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">FA Thailand Technical</p>
            <p className="truncate text-[11px] text-rose-300">หมวด: G15 Women&apos;s Football Series</p>
          </div>
        </Link>
        <div className="flex flex-none items-center gap-1.5 sm:gap-2">
          {canManage ? (
            <Link
              href="/g15-womens-series/manage"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 px-2.5 py-2 text-sm font-medium text-rose-200 transition-colors hover:bg-white/10 hover:text-white sm:px-3"
            >
              <Settings className="h-4 w-4 flex-none" />
              <span className="hidden sm:inline">จัดการข้อมูล</span>
            </Link>
          ) : (
            !user && (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 px-2.5 py-2 text-sm font-medium text-rose-200 transition-colors hover:bg-white/10 hover:text-white sm:px-3"
              >
                <LogIn className="h-4 w-4 flex-none" />
                <span className="hidden sm:inline">เข้าสู่ระบบ</span>
              </Link>
            )
          )}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 px-2.5 py-2 text-sm font-medium text-rose-200 transition-colors hover:bg-white/10 hover:text-white sm:px-3"
          >
            <ArrowLeft className="h-4 w-4 flex-none" />
            <span className="hidden sm:inline">กลับหน้าแรก</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
