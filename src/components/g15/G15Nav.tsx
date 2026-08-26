"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/g15-womens-series", label: "หน้าแรก", en: "Home" },
  { href: "/g15-womens-series/matches", label: "ตารางและผล", en: "Matches & Results" },
  { href: "/g15-womens-series/standings", label: "ตารางคะแนน", en: "Standings" },
  { href: "/g15-womens-series/stats", label: "สถิติ", en: "Statistics" },
  { href: "/g15-womens-series/teams", label: "ทีมที่เข้าร่วม", en: "Teams" },
  { href: "/g15-womens-series/stadium", label: "สนามแข่งขัน", en: "Stadium" },
];

export function G15Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
        {NAV_LINKS.map((link) => {
          // หน้าแรก match แบบตรงเป๊ะเท่านั้น ส่วนหน้าอื่น match ทั้ง prefix (เผื่อมีหน้าย่อยในอนาคต)
          const active = link.href === "/g15-womens-series" ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-none flex-col items-center gap-0.5 border-b-2 px-3.5 py-3 transition-colors ${
                active ? "border-rose-600 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wide sm:text-sm">{link.label}</span>
              <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">{link.en}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
