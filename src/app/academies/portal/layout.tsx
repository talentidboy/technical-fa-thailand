import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAcademyUser } from "@/lib/auth";
import { AcademyTopBar } from "@/components/academy/AcademyShell";
import { PortalNav } from "@/components/academy/PortalNav";
import { HomeButton } from "@/components/HomeButton";
import { academyFont } from "@/components/typefaces/academy";
import { academyLogout } from "../account-actions";
import { LogOut, ExternalLink } from "lucide-react";

// พอร์ทัลอคาเดมี — ต้องล็อกอินด้วยบัญชีอคาเดมี · ยังไม่ได้รับอนุมัติให้ดูแล = เห็นเฉพาะหน้าภาพรวม (สถานะคำขอ)
export default async function AcademyPortalLayout({ children }: { children: React.ReactNode }) {
  const au = await getAcademyUser();
  if (!au) redirect("/academies/login");
  const approved = au.member.status === "APPROVED";
  const unread = approved ? await prisma.academyNotice.count({ where: { academyId: au.member.academyId, readAt: null } }) : 0;

  return (
    <div className={`${academyFont.className} min-h-screen bg-[#f4f8fc]`}>
      <AcademyTopBar subtitle={approved ? au.member.academy.nameEn : "พอร์ทัลอคาเดมี"}>
        <Link href="/academies" className="hidden h-10 items-center gap-1.5 rounded-lg border border-[#0b1220]/25 px-3 text-sm font-semibold text-[#0b1220] hover:bg-white/20 md:inline-flex">
          <ExternalLink className="h-4 w-4" />
          ทำเนียบ
        </Link>
        <form action={academyLogout}>
          <button type="submit" className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#0b1220] px-3 text-sm font-semibold text-white hover:bg-[#1b2230]">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </form>
        <HomeButton />
      </AcademyTopBar>
      {approved && <PortalNav unread={unread} />}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
