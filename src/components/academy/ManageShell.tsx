import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { LOGO_URL } from "@/lib/brand";
import { ArrowLeft, ClipboardList, FileCheck2, UserCheck } from "lucide-react";

// ส่วนหัว + แท็บของหน้าจัดการ Academy Licensing (แอดมิน/เจ้าหน้าที่) พร้อมจำนวนงานที่รออยู่
export async function ManageShell({ active, children }: { active: "registry" | "applications" | "accounts"; children: React.ReactNode }) {
  const [pendingApps, pendingMembers] = await Promise.all([
    prisma.academyApplication.count({ where: { status: "SUBMITTED" } }),
    prisma.academyMember.count({ where: { status: "PENDING" } }),
  ]);
  const tabs = [
    { key: "registry", href: "/academies/manage", label: "ทะเบียนอคาเดมี", icon: ClipboardList, n: 0 },
    { key: "applications", href: "/academies/manage/applications", label: "ใบสมัคร", icon: FileCheck2, n: pendingApps },
    { key: "accounts", href: "/academies/manage/accounts", label: "บัญชีอคาเดมี", icon: UserCheck, n: pendingMembers },
  ];
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-3">
          <Link href="/academies/manage" className="flex items-center gap-2">
            <Image src={LOGO_URL} alt="FA Thailand" width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />
            <div>
              <p className="text-sm font-bold text-white">Academy Licensing</p>
              <p className="text-[11px] text-indigo-300">ระบบจัดการสำหรับสมาคมฯ</p>
            </div>
          </Link>
          <Link href="/academies" className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 hover:bg-white/10 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">ดูหน้าทำเนียบ</span>
          </Link>
        </div>
        <nav aria-label="เมนูจัดการ" className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
          {tabs.map(({ key, href, label, icon: Icon, n }) => (
            <Link
              key={key}
              href={href}
              aria-current={active === key ? "page" : undefined}
              className={`inline-flex flex-none items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium ${
                active === key ? "border-amber-400 text-white" : "border-transparent text-indigo-300 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {n > 0 && <span className="rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-indigo-950">{n}</span>}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
