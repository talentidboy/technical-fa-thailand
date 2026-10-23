import { BrandLogo } from "@/components/BrandLogo";
import Link from "next/link";
import { requireCoach } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/login/actions";
import { MeNav } from "@/components/MeNav";
import { LogOut } from "lucide-react";

export default async function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCoach();
  const unread = await prisma.notification.count({ where: { coachId: user.coachId!, readAt: null } }).catch(() => 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/me" className="flex min-w-0 items-center gap-2.5">
            <BrandLogo tone="white" className="h-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">ศูนย์อบรมผู้ฝึกสอน</p>
              <p className="truncate text-[11px] text-indigo-300">FA Thailand Technical</p>
            </div>
          </Link>
          <div className="flex items-center gap-1.5">
            <MeNav unread={unread} />
            <form action={logout}>
              <button
                type="submit"
                aria-label="ออกจากระบบ"
                title="ออกจากระบบ"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
