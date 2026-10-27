"use client";

import { BrandLogo } from "@/components/BrandLogo";
import Link from "next/link";
import { AcademyLogo } from "@/components/SectionLogos";
import { usePathname } from "next/navigation";
import { ArrowUpRight, BadgeCheck, Building2, FileCheck2, History, LayoutDashboard, UserCheck } from "lucide-react";
import { AdminSwitcher } from "@/components/admin/AdminSwitcher";

type Counts = { applications: number; accounts: number; expiring: number };

const ITEMS = [
  { href: "/academies/manage", label: "ภาพรวม", icon: LayoutDashboard, exact: true },
  { href: "/academies/manage/academies", label: "อคาเดมี", icon: Building2 },
  { href: "/academies/manage/licences", label: "ใบอนุญาต", icon: BadgeCheck, count: "expiring" as const },
  { href: "/academies/manage/applications", label: "ใบสมัคร", icon: FileCheck2, count: "applications" as const },
  { href: "/academies/manage/accounts", label: "บัญชีอคาเดมี", icon: UserCheck, count: "accounts" as const },
  { href: "/academies/manage/activity", label: "บันทึกการแก้ไข", icon: History },
];

// เมนูหลักของหน้าจัดการ: แถบด้านซ้าย (จอใหญ่) / แถบบนเลื่อนแนวนอน (มือถือ)
export function ManageNav({ counts, email, isAdmin }: { counts: Counts; email: string; isAdmin: boolean }) {
  const path = usePathname();
  // หน้ารายละเอียดอคาเดมี /academies/manage/123 นับเป็นเมนู "อคาเดมี"
  const isActive = (href: string, exact?: boolean) =>
    exact ? path === href : path.startsWith(href) || (href === "/academies/manage/academies" && /^\/academies\/manage\/\d+/.test(path));

  return (
    <div className="bg-[#04223a] text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:flex-none lg:flex-col">
      <Link href="/academies/manage" className="flex items-center gap-2.5 px-4 py-3 lg:px-5 lg:py-5">
        <BrandLogo tone="white" className="h-8" />
        <span className="leading-tight">
          <AcademyLogo className="h-7" />
          <span className="mt-1 block text-[11px] text-white/60">ระบบจัดการ (สมาคมฯ)</span>
        </span>
      </Link>
      <div className="hidden px-3 pb-3 lg:block">
        <AdminSwitcher current="academy" isAdmin={isAdmin} wide />
      </div>
      <nav aria-label="เมนูจัดการ" className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-1 lg:flex-col lg:px-3 lg:pb-0">
        {ITEMS.map(({ href, label, icon: Icon, exact, count }) => {
          const active = isActive(href, exact);
          const n = count ? counts[count] : 0;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-none items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-white text-[#0b1f44]" : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 flex-none" />
              <span className="flex-1">{label}</span>
              {n > 0 && <span className="rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-[#0b1f44]">{n}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="hidden border-t border-white/10 px-5 py-4 text-xs text-white/60 lg:block">
        <Link href="/academies" className="inline-flex items-center gap-1 hover:text-white">
          หน้าทำเนียบสาธารณะ
          <ArrowUpRight className="h-3 w-3" />
        </Link>
        <Link href="/dashboard" className="mt-1.5 flex items-center gap-1 hover:text-white">
          ระบบหลักฝ่ายเทคนิค
          <ArrowUpRight className="h-3 w-3" />
        </Link>
        <p className="mt-3 truncate" title={email}>
          {email}
        </p>
      </div>
    </div>
  );
}
