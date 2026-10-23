"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BrandLogo } from "@/components/BrandLogo";
import { display } from "@/components/fonts";
import { logout } from "@/app/login/actions";
import { DEPARTMENTS, departmentHref } from "./departments";
import { ArrowRight, CalendarDays, ChevronDown, Lock, LogOut, Megaphone, Menu, UserCog, X } from "lucide-react";

export type HeaderUser = { email: string; roleLabel: string; isAdmin: boolean; isStaff: boolean };
export type HeaderEvent = { id: number; title: string; color: string; when: string };

const LINKS = [
  { href: "/courses", label: "หลักสูตรอบรม" },
  { href: "/academies", label: "อคาเดมี" },
  { href: "/g15-womens-series", label: "G15" },
  { href: "/#news", label: "ข่าวประกาศ" },
];

// หัวเว็บหน้าแรก: โปร่งใสบนภาพฮีโร่ → เลื่อนลงแล้วเป็นแถบขาว · เมนูหมวดงาน · เมนูผู้ใช้ · เมนูมือถือ
export function HomeHeader({ user, events }: { user: HeaderUser | null; events: HeaderEvent[] }) {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState<"departments" | "user" | "mobile" | null>(null);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const light = solid || open !== null;
  const toggle = (k: NonNullable<typeof open>) => setOpen((v) => (v === k ? null : k));
  const linkTone = light ? "text-slate-600 hover:text-[#073c5e]" : "text-white/80 hover:text-white";

  return (
    <header ref={ref} className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${light ? "border-b border-slate-200 bg-white" : "bg-transparent"}`}>
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex flex-none items-center gap-3" onClick={() => setOpen(null)}>
          <BrandLogo tone={light ? "navy" : "white"} className="h-10" priority />
          <span className={`hidden h-8 w-px sm:block ${light ? "bg-slate-200" : "bg-white/25"}`} />
          <span className={`hidden leading-tight sm:block ${light ? "text-[#073c5e]" : "text-white"}`}>
            <span className={`${display.className} block text-base font-semibold`}>Technical</span>
            <span className={`block text-[11px] ${light ? "text-slate-500" : "text-white/70"}`}>ฝ่ายเทคนิค สมาคมฯ</span>
          </span>
        </Link>

        <nav aria-label="เมนูหลัก" className="hidden flex-1 items-center gap-7 text-sm font-medium lg:flex">
          <button type="button" aria-expanded={open === "departments"} onClick={() => toggle("departments")} className={`inline-flex items-center gap-1 ${linkTone}`}>
            หมวดงาน
            <ChevronDown className={`h-4 w-4 transition-transform ${open === "departments" ? "rotate-180" : ""}`} />
          </button>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkTone}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex flex-none items-center gap-2">
          {user ? (
            <button
              type="button"
              aria-expanded={open === "user"}
              onClick={() => toggle("user")}
              className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-medium transition-colors ${light ? "bg-slate-100 text-slate-800 hover:bg-slate-200" : "bg-white/10 text-white hover:bg-white/20"}`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm font-bold uppercase text-[#073c5e]">{user.email[0]}</span>
              <span className="hidden sm:inline">{user.roleLabel}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          ) : (
            <Link href="/login" className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-[#073c5e] transition-colors hover:bg-amber-300">
              เข้าสู่ระบบ
            </Link>
          )}
          <button
            type="button"
            aria-label="เมนู"
            aria-expanded={open === "mobile"}
            onClick={() => toggle("mobile")}
            className={`flex h-10 w-10 items-center justify-center rounded-full lg:hidden ${light ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"}`}
          >
            {open === "mobile" ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* เมนูหมวดงาน */}
      {open === "departments" && (
        <div className="border-t border-slate-200 bg-white shadow-xl">
          <div className="mx-auto grid max-w-7xl gap-1 px-6 py-6 lg:grid-cols-[1fr_1fr_1fr_16rem]">
            {DEPARTMENTS.map((d) => (
              <Link key={d.key} href={departmentHref(d, !!user)} onClick={() => setOpen(null)} className="group flex gap-3 rounded-lg p-3 hover:bg-slate-50">
                <DeptMark d={d} />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 group-hover:text-[#073c5e]">
                    {d.title}
                    {!d.public && !user && <Lock className="h-3 w-3 text-slate-400" />}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{d.subtitle}</span>
                </span>
              </Link>
            ))}
            <Link href="/#departments" onClick={() => setOpen(null)} className="flex flex-col justify-end rounded-lg bg-[#073c5e] p-5 text-white hover:bg-[#0a4a73]">
              <span className={`${display.className} text-xl font-semibold leading-tight`}>ทุกหมวดงาน
                <br />
                ของฝ่ายเทคนิค</span>
              <span className="mt-3 inline-flex items-center gap-1 text-sm text-amber-300">
                ดูทั้งหมด
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* เมนูผู้ใช้ (แอดมิน/เจ้าหน้าที่) */}
      {open === "user" && user && (
        <div className="absolute right-4 top-full mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl sm:right-6">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">{user.email}</p>
            <p className="text-xs text-slate-500">{user.roleLabel}</p>
          </div>
          <div className="py-1.5 text-sm">
            <MenuLink href="/dashboard" icon={<ArrowRight className="h-4 w-4" />} label="แดชบอร์ดศูนย์อบรมผู้ฝึกสอน" />
            {user.isStaff && <MenuLink href="/announcements" icon={<Megaphone className="h-4 w-4" />} label="จัดการข่าวประกาศ" />}
            {user.isAdmin && <MenuLink href="/users" icon={<UserCog className="h-4 w-4" />} label="ผู้ใช้งานระบบ" />}
            {user.isStaff && <MenuLink href="/calendar" icon={<CalendarDays className="h-4 w-4" />} label="ปฏิทินกิจกรรม" />}
          </div>
          {user.isStaff && events.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Upcoming</p>
              <ul className="mt-2 space-y-2">
                {events.slice(0, 4).map((e) => (
                  <li key={e.id} className="flex items-start gap-2 text-xs">
                    <span className="mt-1 h-2 w-2 flex-none rounded-sm" style={{ backgroundColor: e.color }} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-800">{e.title}</span>
                      <span className="text-slate-400">{e.when}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <form action={logout} className="border-t border-slate-100">
            <button type="submit" className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </button>
          </form>
        </div>
      )}

      {/* เมนูมือถือ */}
      {open === "mobile" && (
        <div className="max-h-[calc(100svh-4.5rem)] overflow-y-auto border-t border-slate-200 bg-white px-4 pb-8 pt-4 shadow-xl lg:hidden">
          <nav aria-label="เมนูมือถือ" className="space-y-1">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(null)} className={`${display.className} block rounded-lg px-3 py-3 text-lg font-semibold text-slate-900 hover:bg-slate-50`}>
                {l.label}
              </Link>
            ))}
          </nav>
          <p className="mt-5 px-3 text-xs font-semibold text-slate-400">หมวดงาน</p>
          <div className="mt-2 space-y-1">
            {DEPARTMENTS.map((d) => (
              <Link key={d.key} href={departmentHref(d, !!user)} onClick={() => setOpen(null)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50">
                <DeptMark d={d} small />
                <span className="flex-1 text-sm font-medium text-slate-800">{d.title}</span>
                {!d.public && !user && <Lock className="h-3.5 w-3.5 text-slate-400" />}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function DeptMark({ d, small = false }: { d: (typeof DEPARTMENTS)[number]; small?: boolean }) {
  const Icon = d.icon;
  const box = small ? "h-9 w-9" : "h-11 w-11";
  return d.badge ? (
    <span className={`relative flex-none overflow-hidden rounded-lg border border-slate-200 bg-white ${box}`}>
      <Image src={d.badge} alt="" fill sizes="44px" className="object-contain p-1" />
    </span>
  ) : (
    <span className={`flex flex-none items-center justify-center rounded-lg text-white ${d.tone} ${box}`}>
      <Icon className="h-5 w-5" />
    </span>
  );
}

function MenuLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-slate-900">
      <span className="text-slate-400">{icon}</span>
      {label}
    </Link>
  );
}
