import Image from "next/image";
import Link from "next/link";
import { requireCoach } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { LOGO_URL } from "@/lib/brand";
import { Home, LogOut } from "lucide-react";

export default async function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCoach();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-2">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm font-bold text-white">
                FA Thailand Technical
              </p>
              <p className="text-[11px] text-indigo-300">โปรไฟล์ของฉัน</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              aria-label="กลับหน้าแรก"
              title="กลับหน้าแรก"
              className="inline-flex items-center justify-center rounded-lg border border-white/15 p-2.5 text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Home className="h-4 w-4" />
            </Link>
            <form action={logout}>
              <button
                type="submit"
                aria-label="ออกจากระบบ"
                title="ออกจากระบบ"
                className="inline-flex items-center justify-center rounded-lg border border-white/15 p-2.5 text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
    </div>
  );
}
