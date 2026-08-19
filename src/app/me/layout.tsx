import Image from "next/image";
import { requireCoach } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { LOGO_URL } from "@/lib/brand";
import { LogOut } from "lucide-react";

export default async function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCoach();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-cover"
            />
            <span className="text-sm font-semibold text-slate-900">
              โปรไฟล์ของฉัน
            </span>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
    </div>
  );
}
