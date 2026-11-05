import Image from "next/image";
import Link from "next/link";
import { getGrassroots, type CountRow, type GenderRow, type GrassrootsEvent, type ProvinceRow } from "@/lib/grassroots";
import { GRASSROOTS_LOGO_URL } from "@/lib/brand";
import { grassrootsBg } from "@/lib/section-images";
import { grassrootsFont } from "@/components/typefaces/grassroots";
import { BrandLogo } from "@/components/BrandLogo";
import { HomeButton } from "@/components/HomeButton";
import { ProvinceMap, provinceCodeByName } from "@/components/ProvinceMap";
import { Reveal } from "@/components/g15/Reveal";
import styles from "./grassroots.module.css";
import { ArrowDown } from "lucide-react";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "ฟุตบอลรากหญ้า Grassroots Football", description: "ฟุตบอลรากหญ้าของสมาคมกีฬาฟุตบอลแห่งประเทศไทย — ฟุตบอลสำหรับทุกคน ทุกวัย ทั่วประเทศ", path: "/grassroots-football" });

const g = grassrootsFont.className;

// สีประจำหมวด: เขียวสนาม · ส้มเสื้อเด็ก · เหลืองสดใส · ฟ้า
const C = { cream: "#fff7e8", green: "#0b4d2c", grass: "#0f7a3d", orange: "#ff6b1a", yellow: "#ffcc29", sky: "#2f9bd6", ink: "#0b2a1a", sand: "#f1e8d6" };
// สีเพศ: บนพื้นเข้ม (สว่าง) / บนพื้นสว่าง (เข้มขึ้นให้อ่านออก) — ตัวเลขใช้สีตัวอักษรปกติเสมอ สีใช้กับแท่งและจุดเท่านั้น
const MALE = "#7cc4ff";
const FEMALE = "#ffb3c7";
const MALE_INK = "#2b8fd1";
const FEMALE_INK = "#e2618c";

const PILLARS = [
  { title: "สนุกเป็นหลัก", description: "ปลูกฝังความรักในกีฬาฟุตบอลผ่านกิจกรรมที่สนุกและเหมาะสมกับวัย", bg: C.grass, fg: "#ffffff" },
  { title: "การมีส่วนร่วม", description: "เปิดโอกาสให้เด็กและเยาวชนทุกคนได้ร่วมกิจกรรมฟุตบอลอย่างทั่วถึง", bg: C.yellow, fg: C.ink },
  { title: "พัฒนาการรอบด้าน", description: "เสริมสร้างทักษะกาย ใจ สังคม และการคิด ควบคู่ไปกับทักษะฟุตบอล", bg: C.orange, fg: "#ffffff" },
  { title: "รากฐานที่มั่นคง", description: "วางรากฐานสู่เส้นทางนักกีฬาและผู้ฝึกสอนในระดับที่สูงขึ้น", bg: C.sky, fg: "#ffffff" },
];

// แผนที่: ช่วงสีคำนวณจากจังหวัดที่มีนักฟุตบอลมากที่สุดของปีนั้น (ปัดเป็นเลขกลมๆ)
const MAP_COLORS = ["#ffe08a", "#ffb547", "#ff8a2a", "#e0550c"];
const MEDAL = ["#ffcc29", "#cfd6dd", "#e3a66d"];
const LICENCE_COLORS = [C.yellow, C.orange, MALE, FEMALE, "#a7f3d0"];
const nice = (n: number) => (n < 10 ? Math.max(1, Math.round(n)) : n < 100 ? Math.round(n / 10) * 10 : Math.round(n / 50) * 50);
const mapBins = (max: number) => [...new Set([1, nice(max * 0.15), nice(max * 0.4), nice(max * 0.7)])].sort((a, b) => a - b);
const n = (v: number) => v.toLocaleString("en-US");
// เปอร์เซ็นต์ปัดเต็ม — มีอยู่จริงแต่ปัดแล้วเป็น 0 แสดง "<1%"
const pctOf = (v: number, total: number) => {
  const p = total > 0 ? (v / total) * 100 : 0;
  return v > 0 && p < 0.5 ? "<1%" : `${Math.round(p)}%`;
};
const widthOf = (v: number, total: number) => `${total > 0 ? (v / total) * 100 : 0}%`;
const thaiDay = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("th-TH", { day: "numeric", month: "short", timeZone: "UTC" });
const thaiMonth = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("th-TH", { month: "long", timeZone: "UTC" });

// ลูกฟุตบอลเล็กคั่นข้อความในริบบิ้น
function Ball({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <circle cx="12" cy="12" r="10.5" fill="currentColor" />
      <path d="M12 7.2l3.6 2.6-1.4 4.2H9.8L8.4 9.8z" fill="#0b4d2c" />
    </svg>
  );
}

// เส้นสนามฟุตบอลบนพื้นหญ้า (ตกแต่งส่วนสถิติ)
function PitchLines() {
  const s = { fill: "none", stroke: "#ffffff", strokeOpacity: 0.16, strokeWidth: 3 };
  return (
    <svg aria-hidden viewBox="0 0 1200 760" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full">
      <rect x="40" y="40" width="1120" height="680" {...s} />
      <line x1="600" y1="40" x2="600" y2="720" {...s} />
      <circle cx="600" cy="380" r="100" {...s} />
      <rect x="40" y="200" width="170" height="360" {...s} />
      <rect x="990" y="200" width="170" height="360" {...s} />
      <rect x="40" y="300" width="60" height="160" {...s} />
      <rect x="1100" y="300" width="60" height="160" {...s} />
      <path d="M210 315 A80 80 0 0 1 210 445" {...s} />
      <path d="M990 315 A80 80 0 0 0 990 445" {...s} />
    </svg>
  );
}

// หัวข้อส่วน (พื้นสว่าง)
function SectionHead({ kicker, title, sub }: { kicker: string; title: React.ReactNode; sub?: string }) {
  return (
    <div>
      <p className={`${g} text-base`} style={{ color: C.orange }}>
        {kicker}
      </p>
      <h2 className={`${g} mt-1 text-4xl font-semibold sm:text-5xl`} style={{ color: C.green }}>
        {title}
      </h2>
      {sub && <p className="mt-2 max-w-2xl text-slate-600">{sub}</p>}
    </div>
  );
}

// การ์ดบนพื้นสว่าง
function Card({ title, note, children, className = "" }: { title: string; note?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[1.25rem] bg-white p-6 shadow-[0_1px_0_rgb(11_77_44/0.06)] ring-1 ring-black/5 ${className}`}>
      <p className={`${g} text-xl font-medium`} style={{ color: C.green }}>
        {title}
      </p>
      {note && <p className="mt-0.5 text-xs text-slate-500">{note}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

// คำอธิบายสีชาย/หญิง
function GenderLegend({ dark = false }: { dark?: boolean }) {
  return (
    <span className={`flex items-center gap-4 text-xs ${dark ? "text-white/75" : "text-slate-500"}`}>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: dark ? MALE : MALE_INK }} />
        ชาย
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: dark ? FEMALE : FEMALE_INK }} />
        หญิง
      </span>
    </span>
  );
}

// ชาย/หญิง: ตัวเลขใหญ่ + แถบสัดส่วน
function GenderSplit({ male, female }: { male: number; female: number }) {
  const total = male + female;
  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "ชาย", v: male, color: MALE_INK },
          { label: "หญิง", v: female, color: FEMALE_INK },
        ].map((x) => (
          <div key={x.label}>
            <p className="flex items-center gap-1.5 text-sm text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: x.color }} />
              {x.label}
            </p>
            <p className={`${g} text-4xl font-semibold tabular-nums`} style={{ color: C.ink }}>
              {n(x.v)}
            </p>
            <p className="text-xs text-slate-500">{pctOf(x.v, total)}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full">
        <span title={`ชาย ${n(male)} คน`} style={{ width: widthOf(male, total), background: MALE_INK }} />
        <span title={`หญิง ${n(female)} คน`} style={{ width: widthOf(female, total), background: FEMALE_INK }} />
      </div>
    </div>
  );
}

// แถวแท่งแนวนอน: ชื่อ · แท่ง · จำนวน (แท่งเดียว หรือแบ่งชาย/หญิง)
function BarRows({ rows, max }: { rows: { label: string; count: number; male?: number; female?: number }[]; max: number }) {
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[6.5rem_minmax(0,1fr)_3.5rem] items-center gap-3 text-sm" title={`${r.label}: ${n(r.count)} คน${r.male != null ? ` (ชาย ${n(r.male)} · หญิง ${n(r.female ?? 0)})` : ""}`}>
          <span className="truncate text-slate-700">{r.label}</span>
          <span className="flex h-3.5 overflow-hidden rounded-full" style={{ background: C.sand }}>
            {r.male != null ? (
              <>
                <span style={{ width: `${(r.male / max) * 100}%`, background: MALE_INK }} />
                <span className="border-l-2 border-white" style={{ width: `${((r.female ?? 0) / max) * 100}%`, background: FEMALE_INK }} />
              </>
            ) : (
              <span className="rounded-full" style={{ width: `${(r.count / max) * 100}%`, background: C.orange }} />
            )}
          </span>
          <span className={`${g} text-right font-semibold tabular-nums`} style={{ color: C.ink }}>
            {n(r.count)}
          </span>
        </li>
      ))}
    </ul>
  );
}

// รายการจังหวัดทั้งหมด (เรียงมาก → น้อย) · 3 อันดับแรกมีเหรียญ · ปีที่มีข้อมูลเพศแสดง ช/ญ ใต้ชื่อ
function ProvinceList({ rows, total, unplaced }: { rows: ProvinceRow[]; total: number; unplaced: number }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ol className="divide-y divide-black/5">
      {rows.map((r, i) => (
        <li key={r.name} className="flex items-center gap-3 py-2" title={`${r.name}: ${n(r.count)} คน (${pctOf(r.count, total)})`}>
          <span className={`${g} flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-semibold tabular-nums`} style={{ background: MEDAL[i] ?? C.sand, color: C.ink }}>
            {i + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium text-slate-800">{r.name}</span>
              <span className={`${g} flex-none font-semibold tabular-nums`} style={{ color: C.green }}>
                {n(r.count)}
              </span>
            </span>
            <span className="mt-1 flex items-center gap-2">
              <span className="block h-1.5 flex-1 rounded-full" style={{ background: C.sand }}>
                <span className="block h-full rounded-full" style={{ width: `${(r.count / max) * 100}%`, background: C.orange }} />
              </span>
              {r.male != null && (
                <span className="flex-none text-[11px] tabular-nums text-slate-500">
                  ช {n(r.male)} · ญ {n(r.female ?? 0)}
                </span>
              )}
            </span>
          </span>
        </li>
      ))}
      {unplaced > 0 && (
        <li className="flex items-center gap-3 py-2 text-sm text-slate-500">
          <span className="h-7 w-7 flex-none" />
          <span className="flex-1">ไม่ระบุจังหวัด / อ่านไม่ได้</span>
          <span className={`${g} font-semibold tabular-nums`}>{n(unplaced)}</span>
        </li>
      )}
    </ol>
  );
}

// แท่งแนวตั้ง (อายุรายปี) — ตัวเลขบนแท่ง · แท่งที่มากที่สุดสีเหลืองเข้ม
function Columns({ rows, unit, axis }: { rows: CountRow[]; unit: string; axis: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const peak = rows.reduce((a, b) => (b.count > a.count ? b : a), rows[0]);
  return (
    <div>
      <div className="flex h-44 items-end gap-1.5 sm:gap-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end" title={`อายุ ${r.label} ${unit}: ${n(r.count)} คน`}>
            <span className={`${g} text-[11px] tabular-nums sm:text-sm`} style={{ color: C.ink }}>
              {n(r.count)}
            </span>
            <span className="mt-1 block w-full rounded-t-md" style={{ height: `${(r.count / max) * 78}%`, minHeight: 2, background: r === peak ? C.orange : "#ffc48f" }} />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 border-t border-black/10 pt-2 sm:gap-2.5">
        {rows.map((r) => (
          <p key={r.label} className="min-w-0 flex-1 text-center text-[11px] tabular-nums text-slate-600 sm:text-xs">
            {r.label}
          </p>
        ))}
      </div>
      <p className="mt-1 text-center text-[11px] text-slate-500">{axis}</p>
    </div>
  );
}

// ไทม์ไลน์กิจกรรม: จัดกลุ่มตามเดือน
function EventTimeline({ events }: { events: GrassrootsEvent[] }) {
  const months = [...new Set(events.map((e) => e.date.slice(0, 7)))];
  const max = Math.max(1, ...events.map((e) => e.coaches));
  return (
    <ol className="space-y-6">
      {months.map((m) => (
        <li key={m} className="grid grid-cols-1 gap-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
          <p className={`${g} text-xl font-medium`} style={{ color: C.green }}>
            {thaiMonth(`${m}-01`)}
          </p>
          <ul className="max-w-2xl space-y-2 border-l-2 pl-4" style={{ borderColor: C.yellow }}>
            {events
              .filter((e) => e.date.startsWith(m))
              .map((e) => (
                <li key={`${e.date}-${e.province}`} className="grid grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,9rem)] items-center gap-3 text-sm">
                  <span className={`${g} font-medium tabular-nums`} style={{ color: C.ink }}>
                    {thaiDay(e.date)}
                  </span>
                  <span className="truncate font-medium text-slate-800">{e.province}</span>
                  <span className="flex items-center gap-2">
                    <span className="block h-2 flex-1 rounded-full" style={{ background: C.sand }}>
                      <span className="block h-full rounded-full" style={{ width: `${(e.coaches / max) * 100}%`, background: C.grass }} />
                    </span>
                    <span className="w-14 flex-none text-right text-xs tabular-nums text-slate-600">{n(e.coaches)} โค้ช</span>
                  </span>
                </li>
              ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

// หน้าสาธารณะ — ไม่ต้องเข้าสู่ระบบ (ข้อมูลสรุปโครงการ ไม่มีข้อมูลส่วนบุคคล)
// ตัวเลขรายปีอยู่ใน src/lib/grassroots.ts · ?year=2025 = ดูปีอื่น · ไม่ระบุ = ปีล่าสุด · ส่วนที่ปีนั้นไม่มีข้อมูลจะไม่แสดง
export default async function GrassrootsFootballPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { report, years } = getGrassroots(Number((await searchParams).year) || undefined);
  const { players, coaches, detail } = report;
  const year = report.year;

  // ใบอนุญาตของผู้ฝึกสอนในโครงการ — ส่วนที่เหลือจากรายการหลัก = ระดับอื่นๆ ที่ไม่ได้แยกไว้
  const licensed = coaches.licenses.reduce((s, l) => s + l.count, 0);
  const otherLicences = Math.max(0, coaches.total - coaches.noLicense - licensed);
  const licenceMix = [
    ...coaches.licenses.map((l, i) => ({ label: l.label, count: l.count, color: LICENCE_COLORS[i % LICENCE_COLORS.length], gender: detail?.coachLicenceGender.find((x) => x.label === l.label) })),
    ...(otherLicences > 0 ? [{ label: "ระดับอื่นๆ", count: otherLicences, color: "#a7f3d0", gender: undefined }] : []),
    { label: "ยังไม่มีใบอนุญาต", count: coaches.noLicense, color: "#d9d2c3", gender: undefined },
  ];

  // แผนที่: ระบายทุกจังหวัดที่มีข้อมูล · ตัวเลขบนแผนที่เฉพาะ 5 อันดับแรก (ไม่ให้รก)
  const mapValues: Record<number, number> = {};
  const markers: { code: number; label: string }[] = [];
  for (const [i, p] of players.byProvince.entries()) {
    const code = provinceCodeByName(p.name);
    if (code == null) continue;
    mapValues[code] = p.count;
    if (i < 5) markers.push({ code, label: n(p.count) });
  }
  const MAP_BINS = mapBins(players.byProvince[0]?.count ?? 1);
  const allProvinces = players.byProvince.length > 5;

  // ตัวเลขสรุปเพิ่มเติม (เฉพาะที่ปีนั้นมีข้อมูล)
  const kpis = [
    { v: report.provinces, label: "จังหวัดที่จัดกิจกรรม" },
    ...(detail
      ? [
          { v: detail.events.length, label: "กิจกรรมหลัก (ครั้ง)" },
          { v: detail.playerSchools, label: "โรงเรียน / สังกัดของนักฟุตบอล" },
          { v: detail.coachOrganisations, label: "หน่วยงานต้นสังกัดของผู้ฝึกสอน" },
          { v: detail.coachFirstTime, label: "ผู้ฝึกสอนที่ร่วมครั้งแรก" },
        ]
      : [{ v: coaches.total - coaches.noLicense, label: "ผู้ฝึกสอนที่มีใบอนุญาต" }]),
  ];
  const ageRows: { label: string; count: number; male?: number; female?: number }[] = detail
    ? detail.playerAgeGender.map((a: GenderRow) => ({ label: a.label, count: a.male + a.female, male: a.male, female: a.female }))
    : players.ageRanges;
  const ageMax = Math.max(1, ...ageRows.map((a) => a.count));
  const peakAge = ageRows.length ? ageRows.reduce((a, b) => (b.count > a.count ? b : a)) : null;

  const nav = [
    { href: "#principles", label: "หลักการ" },
    { href: "#stats", label: `ภาพรวม ${year}` },
    { href: "#players", label: "นักฟุตบอล" },
    { href: "#coaches", label: "ผู้ฝึกสอน" },
    { href: "#map", label: "จังหวัด" },
    ...(detail?.events.length ? [{ href: "#events", label: "กิจกรรม" }] : []),
  ];
  const ribbon = ["สนุกเป็นหลัก", "การมีส่วนร่วม", "พัฒนาการรอบด้าน", "รากฐานที่มั่นคง", "Grassroots Football", `ฤดูกาล ${year}`];

  return (
    <div className="min-h-screen overflow-x-clip text-slate-900" style={{ background: C.cream }}>
      {/* ===== แถบบน ===== */}
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/grassroots-football" className="flex min-w-0 items-center gap-3">
            <span className="relative h-10 w-10 flex-none overflow-hidden rounded-lg">
              <Image src={GRASSROOTS_LOGO_URL} alt="" fill sizes="40px" className="object-contain" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className={`${g} block truncate text-lg font-medium`} style={{ color: C.green }}>
                Grassroots Football
              </span>
              <span className="block truncate text-[11px] text-slate-500">ฟุตบอลรากหญ้า · FA Thailand</span>
            </span>
          </Link>
          <nav aria-label="เมนู Grassroots" className={`${g} hidden flex-1 items-center justify-center gap-6 text-[15px] text-slate-600 lg:flex`}>
            {nav.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-[#ff6b1a]">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex flex-none items-center gap-3">
            <BrandLogo tone="navy" className="hidden h-9 sm:block" />
            <HomeButton />
          </div>
        </div>
      </header>

      {/* ===== ฮีโร่ ===== */}
      <section className="px-4 pb-20 pt-12 sm:px-6 lg:pt-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div>
            <p className={`${g} flex items-center gap-2 text-base font-medium`} style={{ color: C.orange }}>
              <Ball className="h-5 w-5 text-[#ff6b1a]" />
              Grassroots Football · ฤดูกาล {year}
            </p>
            <h1 className={`${g} mt-4 text-[4.5rem] font-semibold leading-[0.95] sm:text-[8.5rem]`}>
              <span className="block" style={{ color: C.green }}>
                ฟุตบอล
              </span>
              <span className="block" style={{ color: C.orange }}>
                รากหญ้า
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-slate-700 sm:text-lg">
              ฟุตบอลรากหญ้า — จุดเริ่มต้นของการพัฒนานักกีฬาและผู้ฝึกสอนฟุตบอลไทย มุ่งส่งเสริมให้เด็กและเยาวชนได้เล่นฟุตบอลอย่างมีความสุขและถูกวิธี
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#stats" className={`${g} inline-flex h-12 items-center gap-2 rounded-xl px-6 text-base font-medium text-white`} style={{ background: C.green }}>
                ดูสถิติปี {year}
                <ArrowDown className="h-4 w-4" />
              </a>
              <a href="#map" className={`${g} inline-flex h-12 items-center rounded-xl border-2 px-6 text-base font-medium`} style={{ borderColor: C.green, color: C.green }}>
                พื้นที่กิจกรรม {report.provinces} จังหวัด
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="-rotate-2 rounded-[1.75rem] border-[10px] border-white bg-white shadow-xl">
              <div className="relative aspect-4/3 overflow-hidden rounded-[1.1rem]">
                <Image src={grassrootsBg} alt="กิจกรรมฟุตบอลรากหญ้า" fill priority placeholder="blur" sizes="(min-width: 1024px) 36rem, 100vw" className="object-cover object-[45%_40%]" />
              </div>
            </div>
            {/* สติกเกอร์ตัวเลข */}
            <div
              className={`${styles.sticker} absolute -left-3 -top-8 flex h-32 w-32 -rotate-12 flex-col items-center justify-center rounded-full text-center shadow-lg sm:-left-8 sm:h-36 sm:w-36`}
              style={{ background: C.yellow, color: C.ink }}
            >
              <span className={`${g} text-4xl font-semibold leading-none`}>{n(players.total)}</span>
              <span className={`${g} mt-1 text-sm`}>นักฟุตบอล</span>
            </div>
            <div className={`${styles.sticker} absolute -bottom-6 right-2 rotate-3 rounded-2xl px-5 py-3 text-white shadow-lg sm:right-6`} style={{ background: C.green }}>
              <span className={`${g} text-3xl font-semibold`}>{n(coaches.total)}</span>
              <span className={`${g} ml-2 text-sm`}>ผู้ฝึกสอนในโครงการ</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ริบบิ้นข้อความวิ่ง ===== */}
      <div className="relative z-10 -rotate-[1.5deg] py-3.5 text-white shadow-md" style={{ background: C.green }}>
        <div className={styles.marquee}>
          <div className={styles.track}>
            {[0, 1].map((copy) => (
              <div key={copy} aria-hidden={copy === 1} className="flex flex-none items-center">
                {ribbon.map((t) => (
                  <span key={t} className={`${g} flex items-center gap-6 whitespace-nowrap px-6 text-xl font-medium sm:text-2xl`}>
                    {t}
                    <Ball className="h-5 w-5 text-[#ffcc29]" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== หลักการ ===== */}
      <section id="principles" className="scroll-mt-20 px-4 pb-20 pt-24 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className={`${g} text-4xl font-semibold sm:text-5xl`} style={{ color: C.green }}>
            หลักการของ<span className="whitespace-nowrap">ฟุตบอลรากหญ้า</span>
          </h2>
          <p className="mt-2 text-slate-600">สี่สิ่งที่ทุกกิจกรรมของเรายึดถือ</p>
          <ol className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p, i) => (
              <li key={p.title}>
                <Reveal delay={i * 90} className="h-full">
                  <div className="flex h-full min-h-64 flex-col rounded-[1.5rem] p-7 transition-transform duration-300 hover:-rotate-1 hover:-translate-y-1" style={{ background: p.bg, color: p.fg }}>
                    <span className={`${g} text-6xl font-semibold leading-none opacity-90`}>{String(i + 1).padStart(2, "0")}</span>
                    <h3 className={`${g} mt-auto pt-10 text-2xl font-semibold`}>{p.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed opacity-90">{p.description}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== ภาพรวมบนสนามหญ้า: ป้ายสกอร์ + ตัวเลขสรุป ===== */}
      <section id="stats" className={`${styles.grass} relative scroll-mt-16 overflow-hidden px-4 py-20 text-white sm:px-6`}>
        <PitchLines />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className={`${g} text-base`} style={{ color: C.yellow }}>
                Season report {year}
              </p>
              <h2 className={`${g} mt-1 text-4xl font-semibold sm:text-5xl`}>
                สถิติโครงการ<span className="whitespace-nowrap">ฟุตบอลรากหญ้า</span> ปี {year}
              </h2>
              <p className="mt-2 text-white/75">สรุปข้อมูลผู้ฝึกสอนและนักฟุตบอลที่เข้าร่วมโครงการทั่วประเทศ</p>
            </div>
            {/* เลือกปี (แสดงเมื่อมีมากกว่า 1 ปี) */}
            {years.length > 1 && (
              <nav aria-label="เลือกปี" className="flex flex-wrap gap-2">
                {years.map((y) => (
                  <Link
                    key={y}
                    href={`/grassroots-football?year=${y}#stats`}
                    scroll={false}
                    aria-current={y === year ? "page" : undefined}
                    className={`${g} inline-flex min-h-11 items-center rounded-full px-5 text-base font-medium transition-colors ${y === year ? "text-[#0b2a1a]" : "bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/20"}`}
                    style={y === year ? { background: C.yellow } : undefined}
                  >
                    ปี {y}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* ป้ายสกอร์ */}
          <Reveal className="mt-10 overflow-hidden rounded-[1.5rem] bg-[#06331d] ring-1 ring-white/10">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-5 py-8 text-center sm:px-10">
              <div>
                <p className={`${g} text-sm text-white/70 sm:text-base`}>นักฟุตบอล</p>
                <p className={`${g} text-5xl font-semibold tabular-nums sm:text-8xl`} style={{ color: C.yellow }}>
                  {n(players.total)}
                </p>
                <p className="mt-1 text-xs text-white/70 sm:text-sm">
                  ชาย {n(players.male)} · หญิง {n(players.female)}
                </p>
              </div>
              <span className={`${g} text-3xl text-white/40 sm:text-6xl`}>:</span>
              <div>
                <p className={`${g} text-sm text-white/70 sm:text-base`}>ผู้ฝึกสอน</p>
                <p className={`${g} text-5xl font-semibold tabular-nums sm:text-8xl`} style={{ color: C.yellow }}>
                  {n(coaches.total)}
                </p>
                <p className="mt-1 text-xs text-white/70 sm:text-sm">
                  ชาย {n(coaches.male)} · หญิง {n(coaches.female)}
                </p>
              </div>
            </div>
          </Reveal>

          {/* ตัวเลขสรุปเพิ่มเติม */}
          <ul className={`mt-4 grid grid-cols-2 gap-3 ${kpis.length > 3 ? "lg:grid-cols-5" : "sm:grid-cols-2"}`}>
            {kpis.map((k, i) => (
              <li key={k.label} className="rounded-2xl px-5 py-4 ring-1 ring-white/10" style={i === 0 ? { background: C.yellow, color: C.ink } : { background: "#0a5c2e" }}>
                <p className={`${g} text-4xl font-semibold leading-none tabular-nums`}>{n(k.v)}</p>
                <p className={`mt-2 text-sm leading-snug ${i === 0 ? "" : "text-white/80"}`}>{k.label}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== นักฟุตบอล ===== */}
      <section id="players" className="scroll-mt-16 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionHead kicker={`Players · ${year}`} title={<>นักฟุตบอล {n(players.total)} คน</>} sub="เพศและอายุของนักฟุตบอลที่เข้าร่วมกิจกรรม" />
          <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <Card title="ชาย / หญิง">
              <GenderSplit male={players.male} female={players.female} />
            </Card>
            <Card
              title="ช่วงอายุ"
              note={peakAge ? `มากที่สุด ${peakAge.label} — ${n(peakAge.count)} คน (${pctOf(peakAge.count, players.total)})` : undefined}
            >
              {detail && (
                <div className="mb-4 flex justify-end">
                  <GenderLegend />
                </div>
              )}
              <BarRows rows={ageRows} max={ageMax} />
              {detail && (
                <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-black/5 pt-3 text-xs text-slate-600 sm:grid-cols-3">
                  {detail.playerAgeGender.map((a) => (
                    <li key={a.label} className="tabular-nums">
                      {a.label}: ช {n(a.male)} · ญ {n(a.female)}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            {detail && (
              <Card
                title="อายุรายปี"
                note={`จำนวนนักฟุตบอลแต่ละอายุ${detail.playerAgeUnclear ? ` · อายุไม่ชัดเจน (ต่ำกว่า 5 ปีหรืออ่านไม่ได้) ${n(detail.playerAgeUnclear)} คน` : ""}`}
                className="lg:col-span-2"
              >
                <Columns rows={detail.playerSingleAges} unit="ปี" axis="อายุ (ปี)" />
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* ===== ผู้ฝึกสอน ===== */}
      <section id="coaches" className="scroll-mt-16 bg-white px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionHead kicker={`Coaches · ${year}`} title={<>ผู้ฝึกสอน {n(coaches.total)} คน</>} sub="ผู้ฝึกสอนที่ร่วมกิจกรรม — เพศ ระดับใบอนุญาต อายุ และประวัติการเข้าร่วม" />
          <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card title="ชาย / หญิง" className="bg-[#fffbf3]">
              <GenderSplit male={coaches.male} female={coaches.female} />
            </Card>
            <Card title="ระดับใบอนุญาตผู้ฝึกสอน" note={`มีใบอนุญาตแล้ว ${n(coaches.total - coaches.noLicense)} คน (${pctOf(coaches.total - coaches.noLicense, coaches.total)})`} className="bg-[#fffbf3]">
              <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-full">
                {licenceMix.map((l) => (
                  <span key={l.label} title={`${l.label}: ${n(l.count)} คน`} style={{ width: widthOf(l.count, coaches.total), minWidth: l.count ? 3 : 0, background: l.color }} />
                ))}
              </div>
              <ul className="mt-4 divide-y divide-black/5">
                {licenceMix.map((l) => (
                  <li key={l.label} className="flex items-center gap-3 py-2 text-sm">
                    <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: l.color }} />
                    <span className="flex-1 text-slate-700">
                      {l.label}
                      {l.gender && (
                        <span className="ml-2 text-xs tabular-nums text-slate-500">
                          ช {n(l.gender.male)} · ญ {n(l.gender.female)}
                        </span>
                      )}
                    </span>
                    <span className={`${g} font-semibold tabular-nums`} style={{ color: C.ink }}>
                      {n(l.count)}
                    </span>
                    <span className="w-10 text-right text-xs tabular-nums text-slate-500">{pctOf(l.count, coaches.total)}</span>
                  </li>
                ))}
              </ul>
            </Card>
            {detail && (
              <Card title="ช่วงอายุ" note={`อายุเฉลี่ย ${detail.coachAverageAge} ปี`} className="bg-[#fffbf3]">
                <BarRows rows={detail.coachAges} max={Math.max(1, ...detail.coachAges.map((a) => a.count))} />
              </Card>
            )}
            {detail && (
              <Card title="ประวัติการเข้าร่วมกิจกรรมของสมาคมฯ" note="ผู้ฝึกสอนตอบในแบบฟอร์มลงทะเบียน" className="bg-[#fffbf3]">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "ร่วมครั้งแรก", v: detail.coachFirstTime, color: C.orange },
                    { label: "เคยเข้าร่วมแล้ว", v: detail.coachReturning, color: C.grass },
                  ].map((x) => (
                    <div key={x.label}>
                      <p className="flex items-center gap-1.5 text-sm text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: x.color }} />
                        {x.label}
                      </p>
                      <p className={`${g} text-4xl font-semibold tabular-nums`} style={{ color: C.ink }}>
                        {n(x.v)}
                      </p>
                      <p className="text-xs text-slate-500">{pctOf(x.v, detail.coachFirstTime + detail.coachReturning)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full">
                  <span style={{ width: widthOf(detail.coachFirstTime, detail.coachFirstTime + detail.coachReturning), background: C.orange }} />
                  <span style={{ width: widthOf(detail.coachReturning, detail.coachFirstTime + detail.coachReturning), background: C.grass }} />
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* ===== จังหวัด: แผนที่ + รายการทุกจังหวัด ===== */}
      <section id="map" className="scroll-mt-16 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionHead
            kicker={`Provinces · ${year}`}
            title={<>พื้นที่กิจกรรม {report.provinces} จังหวัด</>}
            sub={
              allProvinces
                ? `แผนที่ระบายสีทุกจังหวัดที่มีนักฟุตบอลเข้าร่วม (${players.byProvince.length} จังหวัด นับตามจังหวัดที่จัดกิจกรรม ถ้าไม่ได้กรอกใช้จังหวัดที่อาศัย) — ตัวเลขบนแผนที่คือ 5 จังหวัดที่มากที่สุด`
                : "จังหวัดที่มีผู้เข้าร่วมมากที่สุด — ตัวเลขบนแผนที่คือจำนวนนักฟุตบอลใน 5 จังหวัดแรก"
            }
          />
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)_minmax(0,1fr)]">
            <figure className="mx-auto w-full max-w-sm rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5 lg:sticky lg:top-24 lg:self-start">
              <ProvinceMap
                values={mapValues}
                bins={MAP_BINS}
                colors={MAP_COLORS}
                zero="#efe7d6"
                unit="คน"
                markers={markers}
                markerColor={C.green}
                title={allProvinces ? `แผนที่จำนวนนักฟุตบอลรากหญ้าตามจังหวัด ปี ${year}` : `แผนที่ 5 จังหวัดที่มีนักฟุตบอลรากหญ้าเข้าร่วมมากที่สุด ปี ${year}`}
              />
              <figcaption className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                {MAP_BINS.map((b, i) => (
                  <span key={b} className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-4 rounded-sm" style={{ background: MAP_COLORS[i] }} />
                    {MAP_BINS[i + 1] ? `${n(b)}–${n(MAP_BINS[i + 1] - 1)}` : `${n(b)}+`}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-4 rounded-sm bg-[#efe7d6]" />
                  {allProvinces ? "ไม่มีข้อมูล" : "ไม่อยู่ใน 5 อันดับ"}
                </span>
              </figcaption>
            </figure>
            <Card title={allProvinces ? `นักฟุตบอล · ${players.byProvince.length} จังหวัด` : "นักฟุตบอล · 5 อันดับจังหวัด"} note={players.byProvince.some((p) => p.male != null) ? "ช = ชาย · ญ = หญิง" : undefined}>
              <ProvinceList rows={players.byProvince} total={players.total} unplaced={report.unplacedPlayers} />
            </Card>
            <Card title={coaches.byProvince.length > 5 ? `ผู้ฝึกสอน · ${coaches.byProvince.length} จังหวัด` : "ผู้ฝึกสอน · 5 อันดับจังหวัด"}>
              <ProvinceList rows={coaches.byProvince} total={coaches.total} unplaced={report.unplacedCoaches} />
            </Card>
          </div>
        </div>
      </section>

      {/* ===== ไทม์ไลน์กิจกรรม ===== */}
      {detail && detail.events.length > 0 && (
        <section id="events" className="scroll-mt-16 bg-white px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <SectionHead
              kicker={`Activities · ${year}`}
              title={<>กิจกรรมหลัก {n(detail.events.length)} ครั้ง</>}
              sub="วันที่และจังหวัดที่จัดกิจกรรม พร้อมจำนวนผู้ฝึกสอนที่ลงทะเบียน — แสดงเฉพาะกิจกรรมที่มีผู้ฝึกสอนลงทะเบียนตั้งแต่ 5 คนขึ้นไป"
            />
            <div className="mt-10">
              <EventTimeline events={detail.events} />
            </div>
          </div>
        </section>
      )}

      <p className="mx-auto max-w-7xl px-4 py-8 text-xs leading-relaxed text-slate-500 sm:px-6">
        ข้อมูลจาก{report.source}
        {detail && " · นับทุกคนที่ลงทะเบียน (ผู้ที่ลงทะเบียนหลายกิจกรรมนับตามจำนวนครั้ง) · จำนวนโรงเรียน/หน่วยงานนับจากชื่อที่กรอก (โดยประมาณ)"}
      </p>

      <footer className="px-4 py-10 text-white sm:px-6" style={{ background: C.green }}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-3">
            <BrandLogo tone="white" className="h-9" />
            <span className={`${g} text-lg`}>Grassroots Football</span>
          </span>
          <span className="text-white/70">ฝ่ายเทคนิค สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์</span>
        </div>
      </footer>
    </div>
  );
}
