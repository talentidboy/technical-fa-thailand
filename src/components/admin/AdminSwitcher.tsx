"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LayoutGrid, ListChecks } from "lucide-react";
import { areasFor } from "./areas";

// ปุ่ม "ระบบจัดการ" ในหัวของทุกหมวด: กดแล้วเลือกไปหมวดอื่นได้ทันที + ลิงก์ศูนย์ควบคุม (งานที่ต้องทำทั้งหมด)
// tone="dark" บนพื้นเข้ม (แถบซ้าย/หัวสีเข้ม) · "light" บนพื้นขาว · wide = เต็มความกว้าง (ในแถบซ้าย)
export function AdminSwitcher({ current, isAdmin, tone = "dark", wide = false }: { current?: string; isAdmin: boolean; tone?: "dark" | "light"; wide?: boolean }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const areas = areasFor(isAdmin);
  const here = areas.find((a) => a.key === current);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const btn =
    tone === "dark"
      ? "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15"
      : "bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50";

  return (
    <div ref={box} className={`relative ${wide ? "w-full" : ""}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${btn} ${wide ? "w-full" : ""}`}
      >
        <LayoutGrid className="h-4 w-4 flex-none opacity-80" />
        <span className="min-w-0 flex-1 truncate">
          <span className={`block text-[10px] font-medium leading-tight ${tone === "dark" ? "text-white/55" : "text-slate-500"}`}>สลับระบบจัดการ</span>
          <span className="block truncate leading-tight">{here?.label ?? "ระบบจัดการทั้งหมด"}</span>
        </span>
        <ChevronDown className={`h-4 w-4 flex-none opacity-70 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="menu" className="absolute left-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl bg-white text-slate-800 shadow-2xl ring-1 ring-slate-200">
          <Link href="/admin" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-3 border-b border-slate-100 bg-amber-50 px-4 py-3 hover:bg-amber-100">
            <ListChecks className="h-5 w-5 flex-none text-amber-700" />
            <span>
              <span className="block text-sm font-bold text-slate-900">ศูนย์ควบคุม</span>
              <span className="block text-xs text-slate-500">งานที่ต้องทำทั้งหมดในหน้าเดียว</span>
            </span>
          </Link>
          <ul className="max-h-[60vh] overflow-y-auto p-1.5">
            {areas.map((a) => {
              const Icon = a.icon;
              const active = a.key === current;
              return (
                <li key={a.key}>
                  <Link
                    href={a.href}
                    role="menuitem"
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-2.5 py-2 ${active ? "bg-slate-100" : "hover:bg-slate-50"}`}
                  >
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-white" style={{ background: a.hex }}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{a.label}</span>
                      <span className="block truncate text-xs text-slate-500">{a.desc}</span>
                    </span>
                    {active && <span className="text-[11px] font-semibold text-slate-500">อยู่ที่นี่</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
