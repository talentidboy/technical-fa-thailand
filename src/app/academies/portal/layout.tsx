import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAcademyUser } from "@/lib/auth";
import { AcademyTopBar } from "@/components/academy/AcademyShell";
import { PortalNav } from "@/components/academy/PortalNav";
import { academyLogout } from "../account-actions";
import { LogOut, ExternalLink } from "lucide-react";

// พอร์ทัลอคาเดมี — ต้องล็อกอินด้วยบัญชีอคาเดมี · ยังไม่ได้รับอนุมัติให้ดูแล = เห็นเฉพาะหน้าภาพรวม (สถานะคำขอ)
export default async function AcademyPortalLayout({ children }: { children: React.ReactNode }) {
  const au = await getAcademyUser();
  if (!au) redirect("/academies/login");
  const approved = au.member.status === "APPROVED";
  const unread = approved ? await prisma.academyNotice.count({ where: { academyId: au.member.academyId, readAt: null } }) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <AcademyTopBar subtitle={approved ? au.member.academy.nameEn : "พอร์ทัลอคาเดมี"}>
        <Link href="/academies" className="hidden items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm text-indigo-200 hover:bg-white/10 sm:inline-flex">
          <ExternalLink className="h-4 w-4" />
          ทำเนียบ
        </Link>
        <form action={academyLogout}>
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </form>
      </AcademyTopBar>
      {approved && <PortalNav unread={unread} />}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
