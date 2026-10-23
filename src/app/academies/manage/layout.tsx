import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { EXPIRING_DAYS } from "@/lib/academy";
import { ManageNav } from "@/components/academy/ManageNav";

export const metadata: Metadata = { title: "จัดการ Academy Licensing | FA Thailand" };

// โครงหน้าจัดการ: เมนูซ้าย + เนื้อหา · เฉพาะแอดมิน/เจ้าหน้าที่
export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) redirect("/academies");
  const now = new Date();
  const soon = new Date(now.getTime() + EXPIRING_DAYS * 86_400_000);
  const [applications, accounts, expiring] = await Promise.all([
    prisma.academyApplication.count({ where: { status: "SUBMITTED" } }),
    prisma.academyMember.count({ where: { status: "PENDING" } }),
    prisma.academyLicence.count({ where: { status: "ACTIVE", expiresAt: { gte: now, lte: soon }, academy: { active: true } } }),
  ]);
  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <ManageNav counts={{ applications, accounts, expiring }} email={user.email} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
