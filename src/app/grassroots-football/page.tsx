import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getGrassroots, type CountRow, type GenderRow, type GrassrootsEvent, type ProvinceRow } from "@/lib/grassroots";
import { GRASSROOTS_LOGO_URL } from "@/lib/brand";
import { grassrootsBg } from "@/lib/section-images";
import { grassrootsFont } from "@/components/typefaces/grassroots";
import { BrandLogo } from "@/components/BrandLogo";
import { HomeButton } from "@/components/HomeButton";
import { ProvinceMap, provinceCodeByName, provinceEnByName } from "@/components/ProvinceMap";
import { Reveal } from "@/components/g15/Reveal";
import styles from "./grassroots.module.css";
import { ArrowDown } from "lucide-react";
import { pageMeta } from "@/lib/seo";

type Lang = "th" | "en";
type SP = Promise<{ year?: string; lang?: string }>;
const langOf = (v?: string): Lang => (v === "en" ? "en" : "th");

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  return langOf((await searchParams).lang) === "en"
    ? pageMeta({ title: "Grassroots Football", description: "Grassroots football by the Football Association of Thailand — football for everyone, every age, across the country", path: "/grassroots-football?lang=en" })
    : pageMeta({ title: "ฟุตบอลรากหญ้า Grassroots Football", description: "ฟุตบอลรากหญ้าของสมาคมกีฬาฟุตบอลแห่งประเทศไทย — ฟุตบอลสำหรับทุกคน ทุกวัย ทั่วประเทศ", path: "/grassroots-football" });
}

const g = grassrootsFont.className;

// สีประจำหมวด: เขียวสนาม · ส้มเสื้อเด็ก · เหลืองสดใส · ฟ้า
const C = { cream: "#fff7e8", green: "#0b4d2c", grass: "#0f7a3d", orange: "#ff6b1a", yellow: "#ffcc29", sky: "#2f9bd6", ink: "#0b2a1a", sand: "#f1e8d6" };
// สีเพศ: ตัวเลขใช้สีตัวอักษรปกติเสมอ สีใช้กับแท่งและจุดเท่านั้น
const MALE = "#7cc4ff";
const FEMALE = "#ffb3c7";
const MALE_INK = "#2b8fd1";
const FEMALE_INK = "#e2618c";

// ===== ข้อความ 2 ภาษา (?lang=en = อังกฤษ) =====
const T = {
  th: {
    logoSub: "ฟุตบอลรากหญ้า · FA Thailand",
    nav: { principles: "หลักการ", overview: "ภาพรวม", players: "นักฟุตบอล", coaches: "ผู้ฝึกสอน", provinces: "จังหวัด", events: "กิจกรรม" },
    heroKicker: (y: number) => `Grassroots Football · ฤดูกาล ${y}`,
    heroTitle: ["ฟุตบอล", "รากหญ้า"],
    heroIntro: "ฟุตบอลรากหญ้า — จุดเริ่มต้นของการพัฒนานักกีฬาและผู้ฝึกสอนฟุตบอลไทย มุ่งส่งเสริมให้เด็กและเยาวชนได้เล่นฟุตบอลอย่างมีความสุขและถูกวิธี",
    heroStats: (y: number) => `ดูสถิติปี ${y}`,
    heroArea: (p: number) => `พื้นที่กิจกรรม ${p} จังหวัด`,
    photoAlt: "กิจกรรมฟุตบอลรากหญ้า",
    stickerPlayers: "นักฟุตบอล",
    stickerCoaches: "ผู้ฝึกสอนในโครงการ",
    season: (y: number) => `ฤดูกาล ${y}`,
    pillarsTitle: ["หลักการของ", "ฟุตบอลรากหญ้า"],
    pillarsSub: "สี่สิ่งที่ทุกกิจกรรมของเรายึดถือ",
    pillars: [
      ["สนุกเป็นหลัก", "ปลูกฝังความรักในกีฬาฟุตบอลผ่านกิจกรรมที่สนุกและเหมาะสมกับวัย"],
      ["การมีส่วนร่วม", "เปิดโอกาสให้เด็กและเยาวชนทุกคนได้ร่วมกิจกรรมฟุตบอลอย่างทั่วถึง"],
      ["พัฒนาการรอบด้าน", "เสริมสร้างทักษะกาย ใจ สังคม และการคิด ควบคู่ไปกับทักษะฟุตบอล"],
      ["รากฐานที่มั่นคง", "วางรากฐานสู่เส้นทางนักกีฬาและผู้ฝึกสอนในระดับที่สูงขึ้น"],
    ],
    statsTitle: (y: number) => <>สถิติโครงการ<span className="whitespace-nowrap">ฟุตบอลรากหญ้า</span> ปี {y}</>,
    statsSub: "สรุปข้อมูลผู้ฝึกสอนและนักฟุตบอลที่เข้าร่วมโครงการทั่วประเทศ",
    chooseYear: "เลือกปี",
    yearLabel: (y: number) => `ปี ${y}`,
    players: "นักฟุตบอล",
    coaches: "ผู้ฝึกสอน",
    mf: (m: number, f: number) => `ชาย ${n(m)} · หญิง ${n(f)}`,
    male: "ชาย",
    female: "หญิง",
    short: (m: number, f: number) => `ช ${n(m)} · ญ ${n(f)}`,
    people: "คน",
    kpi: {
      provinces: "จังหวัดที่จัดกิจกรรม",
      events: "กิจกรรมหลัก (ครั้ง)",
      schools: "โรงเรียน / สังกัดของนักฟุตบอล",
      orgs: "หน่วยงานต้นสังกัดของผู้ฝึกสอน",
      firstTime: "ผู้ฝึกสอนที่ร่วมครั้งแรก",
      licensed: "ผู้ฝึกสอนที่มีใบอนุญาต",
    },
    playersTitle: (v: number) => `นักฟุตบอล ${n(v)} คน`,
    playersSub: "เพศและอายุของนักฟุตบอลที่เข้าร่วมกิจกรรม",
    genderCard: "ชาย / หญิง",
    ageCard: "ช่วงอายุ",
    agePeak: (label: string, v: number, p: string) => `มากที่สุด ${label} — ${n(v)} คน (${p})`,
    singleAgeCard: "อายุรายปี",
    singleAgeNote: (u: number) => `จำนวนนักฟุตบอลแต่ละอายุ${u ? ` · อายุไม่ชัดเจน (ต่ำกว่า 5 ปีหรืออ่านไม่ได้) ${n(u)} คน` : ""}`,
    ageAxis: "อายุ (ปี)",
    coachesTitle: (v: number) => `ผู้ฝึกสอน ${n(v)} คน`,
    coachesSub: "ผู้ฝึกสอนที่ร่วมกิจกรรม — เพศ ระดับใบอนุญาต อายุ และประวัติการเข้าร่วม",
    licenceCard: "ระดับใบอนุญาตผู้ฝึกสอน",
    licensedNote: (v: number, p: string) => `มีใบอนุญาตแล้ว ${n(v)} คน (${p})`,
    otherLevels: "ระดับอื่นๆ",
    noLicence: "ยังไม่มีใบอนุญาต",
    coachAgeNote: (a: number) => `อายุเฉลี่ย ${a} ปี`,
    historyCard: "ประวัติการเข้าร่วมกิจกรรมของสมาคมฯ",
    historyNote: "ผู้ฝึกสอนตอบในแบบฟอร์มลงทะเบียน",
    firstTime: "ร่วมครั้งแรก",
    returning: "เคยเข้าร่วมแล้ว",
    mapTitle: (p: number) => `พื้นที่กิจกรรม ${p} จังหวัด`,
    mapSubAll: (k: number) => `แผนที่ระบายสีทุกจังหวัดที่มีนักฟุตบอลเข้าร่วม (${k} จังหวัด นับตามจังหวัดที่จัดกิจกรรม ถ้าไม่ได้กรอกใช้จังหวัดที่อาศัย) — ตัวเลขบนแผนที่คือ 5 จังหวัดที่มากที่สุด`,
    mapSubTop: "จังหวัดที่มีผู้เข้าร่วมมากที่สุด — ตัวเลขบนแผนที่คือจำนวนนักฟุตบอลใน 5 จังหวัดแรก",
    mapAria: (all: boolean, y: number) => (all ? `แผนที่จำนวนนักฟุตบอลรากหญ้าตามจังหวัด ปี ${y}` : `แผนที่ 5 จังหวัดที่มีนักฟุตบอลรากหญ้าเข้าร่วมมากที่สุด ปี ${y}`),
    noData: "ไม่มีข้อมูล",
    notTop5: "ไม่อยู่ใน 5 อันดับ",
    playersProv: (k: number, all: boolean) => (all ? `นักฟุตบอล · ${k} จังหวัด` : "นักฟุตบอล · 5 อันดับจังหวัด"),
    coachesProv: (k: number, all: boolean) => (all ? `ผู้ฝึกสอน · ${k} จังหวัด` : "ผู้ฝึกสอน · 5 อันดับจังหวัด"),
    mfKey: "ช = ชาย · ญ = หญิง",
    unplaced: "ไม่ระบุจังหวัด / อ่านไม่ได้",
    eventsTitle: (k: number) => `กิจกรรมหลัก ${n(k)} ครั้ง`,
    eventsSub: "วันที่และจังหวัดที่จัดกิจกรรม พร้อมจำนวนผู้ฝึกสอนที่ลงทะเบียน — แสดงเฉพาะกิจกรรมที่มีผู้ฝึกสอนลงทะเบียนตั้งแต่ 5 คนขึ้นไป",
    coachesShort: "โค้ช",
    source: (s: string) => `ข้อมูลจาก${s}`,
    method: " · นับทุกคนที่ลงทะเบียน (ผู้ที่ลงทะเบียนหลายกิจกรรมนับตามจำนวนครั้ง) · จำนวนโรงเรียน/หน่วยงานนับจากชื่อที่กรอก (โดยประมาณ)",
    footer: "ฝ่ายเทคนิค สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์",
    locale: "th-TH",
  },
  en: {
    logoSub: "Football Association of Thailand",
    nav: { principles: "Principles", overview: "Overview", players: "Players", coaches: "Coaches", provinces: "Provinces", events: "Activities" },
    heroKicker: (y: number) => `Grassroots Football · Season ${y}`,
    heroTitle: ["Grassroots", "Football"],
    heroIntro: "Grassroots football is where Thai football begins — developing players and coaches, and helping every child and young person enjoy the game safely and the right way.",
    heroStats: (y: number) => `${y} statistics`,
    heroArea: (p: number) => `Activities in ${p} provinces`,
    photoAlt: "Grassroots football activity",
    stickerPlayers: "players",
    stickerCoaches: "coaches in the programme",
    season: (y: number) => `Season ${y}`,
    pillarsTitle: ["Principles of ", "grassroots football"],
    pillarsSub: "Four things every activity stands for",
    pillars: [
      ["Fun first", "Building a love of football through fun, age-appropriate activities"],
      ["Participation", "Giving every child and young person a chance to play"],
      ["All-round development", "Physical, mental, social and thinking skills alongside football skills"],
      ["Strong foundations", "The first step on the pathway for players and coaches"],
    ],
    statsTitle: (y: number) => <>Grassroots Football in {y}</>,
    statsSub: "Players and coaches taking part in the programme across Thailand",
    chooseYear: "Choose year",
    yearLabel: (y: number) => `${y}`,
    players: "Players",
    coaches: "Coaches",
    mf: (m: number, f: number) => `Male ${n(m)} · Female ${n(f)}`,
    male: "Male",
    female: "Female",
    short: (m: number, f: number) => `M ${n(m)} · F ${n(f)}`,
    people: "",
    kpi: {
      provinces: "Provinces hosting activities",
      events: "Main activities",
      schools: "Schools / clubs of players",
      orgs: "Coaches' organisations",
      firstTime: "First-time coaches",
      licensed: "Licensed coaches",
    },
    playersTitle: (v: number) => `${n(v)} players`,
    playersSub: "Gender and age of the players who took part",
    genderCard: "Male / Female",
    ageCard: "Age groups",
    agePeak: (label: string, v: number, p: string) => `Largest group: ${label} — ${n(v)} (${p})`,
    singleAgeCard: "Players by age",
    singleAgeNote: (u: number) => `Number of players at each age${u ? ` · ${n(u)} with an unclear age (under 5 or unreadable)` : ""}`,
    ageAxis: "Age (years)",
    coachesTitle: (v: number) => `${n(v)} coaches`,
    coachesSub: "Coaches who took part — gender, licence level, age and previous participation",
    licenceCard: "Coaching licence",
    licensedNote: (v: number, p: string) => `${n(v)} licensed (${p})`,
    otherLevels: "Other levels",
    noLicence: "No licence yet",
    coachAgeNote: (a: number) => `Average age ${a}`,
    historyCard: "Previous FA Thailand activities",
    historyNote: "As answered by coaches on the registration form",
    firstTime: "First time",
    returning: "Returning",
    mapTitle: (p: number) => `Activities in ${p} provinces`,
    mapSubAll: (k: number) => `Every province with participating players is shaded (${k} provinces, by the province of the activity, or home province if not given) — numbers mark the top 5`,
    mapSubTop: "Provinces with the most participants — numbers mark the top 5",
    mapAria: (all: boolean, y: number) => (all ? `Map of grassroots players by province, ${y}` : `Map of the top 5 provinces by grassroots players, ${y}`),
    noData: "No data",
    notTop5: "Not in top 5",
    playersProv: (k: number, all: boolean) => (all ? `Players · ${k} provinces` : "Players · top 5 provinces"),
    coachesProv: (k: number, all: boolean) => (all ? `Coaches · ${k} provinces` : "Coaches · top 5 provinces"),
    mfKey: "M = male · F = female",
    unplaced: "Province not given",
    eventsTitle: (k: number) => `${n(k)} main activities`,
    eventsSub: "Date and province of each activity with the number of coaches registered — activities with at least 5 coaches registered",
    coachesShort: "coaches",
    source: (s: string) => `Source: ${s}`,
    method: " · Every registration is counted (people who joined several activities are counted each time) · Schools and organisations are counted from the names entered (approximate)",
    footer: "Technical Department, Football Association of Thailand under the Patronage of His Majesty the King",
    locale: "en-GB",
  },
};
type Dict = (typeof T)["th"];

const PILLAR_STYLE = [
  { bg: C.grass, fg: "#ffffff" },
  { bg: C.yellow, fg: C.ink },
  { bg: C.orange, fg: "#ffffff" },
  { bg: C.sky, fg: "#ffffff" },
];

// ป้ายกำกับในข้อมูลเป็นภาษาไทย (เช่น "8–10 ปี", "ต่ำกว่า 20 ปี") — แปลงเป็นอังกฤษ
const labelEn = (s: string) =>
  s
    .replace(/^ต่ำกว่า (\d+) ปี$/, "Under $1")
    .replace(/^(\d+) ปีขึ้นไป$/, "$1+")
    .replace(/ ปี$/, " yrs");

// แผนที่: ช่วงสีคำนวณจากจังหวัดที่มีนักฟุตบอลมากที่สุดของปีนั้น (ปัดเป็นเลขกลมๆ)
const MAP_COLORS = ["#ffe08a", "#ffb547", "#ff8a2a", "#e0550c"];
const MEDAL = ["#ffcc29", "#cfd6dd", "#e3a66d"];
const LICENCE_COLORS = [C.yellow, C.orange, MALE, FEMALE, "#a7f3d0"];
const nice = (v: number) => (v < 10 ? Math.max(1, Math.round(v)) : v < 100 ? Math.round(v / 10) * 10 : Math.round(v / 50) * 50);
const mapBins = (max: number) => [...new Set([1, nice(max * 0.15), nice(max * 0.4), nice(max * 0.7)])].sort((a, b) => a - b);
const n = (v: number) => v.toLocaleString("en-US");
// เปอร์เซ็นต์ปัดเต็ม — มีอยู่จริงแต่ปัดแล้วเป็น 0 แสดง "<1%"
const pctOf = (v: number, total: number) => {
  const p = total > 0 ? (v / total) * 100 : 0;
  return v > 0 && p < 0.5 ? "<1%" : `${Math.round(p)}%`;
};
const widthOf = (v: number, total: number) => `${total > 0 ? (v / total) * 100 : 0}%`;
const dayLabel = (iso: string, locale: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, { day: "numeric", month: "short", timeZone: "UTC" });
const monthLabel = (iso: string, locale: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, { month: "long", timeZone: "UTC" });

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

// ปุ่มสลับภาษา (คงปีที่เลือกไว้)
function LangSwitch({ lang, year }: { lang: Lang; year: number }) {
  const href = (l: Lang) => `/grassroots-football?${new URLSearchParams({ year: String(year), ...(l === "en" ? { lang: "en" } : {}) })}`;
  return (
    <nav aria-label="Language / ภาษา" className={`${g} flex h-10 flex-none items-center rounded-lg border border-slate-300 p-0.5 text-sm font-medium`}>
      {(["th", "en"] as const).map((l) => (
        <Link
          key={l}
          href={href(l)}
          hrefLang={l}
          aria-current={l === lang ? "true" : undefined}
          className={`flex h-full min-w-10 items-center justify-center rounded-md px-2.5 ${l === lang ? "text-white" : "text-slate-600 hover:bg-slate-100"}`}
          style={l === lang ? { background: C.green } : undefined}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </nav>
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
function GenderLegend({ t }: { t: Dict }) {
  return (
    <span className="flex items-center gap-4 text-xs text-slate-500">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: MALE_INK }} />
        {t.male}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: FEMALE_INK }} />
        {t.female}
      </span>
    </span>
  );
}

// สองค่าเทียบกัน: ตัวเลขใหญ่ + แถบสัดส่วน (ชาย/หญิง หรือ ครั้งแรก/เคยร่วม)
function PairSplit({ items }: { items: [{ label: string; v: number; color: string }, { label: string; v: number; color: string }] }) {
  const total = items[0].v + items[1].v;
  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {items.map((x) => (
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
        {items.map((x) => (
          <span key={x.label} title={`${x.label} ${n(x.v)}`} style={{ width: widthOf(x.v, total), background: x.color }} />
        ))}
      </div>
    </div>
  );
}

// แถวแท่งแนวนอน: ชื่อ · แท่ง · จำนวน (แท่งเดียว หรือแบ่งชาย/หญิง)
function BarRows({ rows, max, t }: { rows: { label: string; count: number; male?: number; female?: number }[]; max: number; t: Dict }) {
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[6.5rem_minmax(0,1fr)_3.5rem] items-center gap-3 text-sm" title={`${r.label}: ${n(r.count)}${r.male != null ? ` (${t.mf(r.male, r.female ?? 0)})` : ""}`}>
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

// รายการจังหวัดทั้งหมด (เรียงมาก → น้อย) · 3 อันดับแรกมีเหรียญ · ปีที่มีข้อมูลเพศแสดง ชาย/หญิงใต้ชื่อ
function ProvinceList({ rows, total, unplaced, t, name }: { rows: ProvinceRow[]; total: number; unplaced: number; t: Dict; name: (th: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ol className="divide-y divide-black/5">
      {rows.map((r, i) => (
        <li key={r.name} className="flex items-center gap-3 py-2" title={`${name(r.name)}: ${n(r.count)} (${pctOf(r.count, total)})`}>
          <span className={`${g} flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-semibold tabular-nums`} style={{ background: MEDAL[i] ?? C.sand, color: C.ink }}>
            {i + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium text-slate-800">{name(r.name)}</span>
              <span className={`${g} flex-none font-semibold tabular-nums`} style={{ color: C.green }}>
                {n(r.count)}
              </span>
            </span>
            <span className="mt-1 flex items-center gap-2">
              <span className="block h-1.5 flex-1 rounded-full" style={{ background: C.sand }}>
                <span className="block h-full rounded-full" style={{ width: `${(r.count / max) * 100}%`, background: C.orange }} />
              </span>
              {r.male != null && <span className="flex-none text-[11px] tabular-nums text-slate-500">{t.short(r.male, r.female ?? 0)}</span>}
            </span>
          </span>
        </li>
      ))}
      {unplaced > 0 && (
        <li className="flex items-center gap-3 py-2 text-sm text-slate-500">
          <span className="h-7 w-7 flex-none" />
          <span className="flex-1">{t.unplaced}</span>
          <span className={`${g} font-semibold tabular-nums`}>{n(unplaced)}</span>
        </li>
      )}
    </ol>
  );
}

// แท่งแนวตั้ง (อายุรายปี) — ตัวเลขบนแท่ง · แท่งที่มากที่สุดสีส้มเข้ม
function Columns({ rows, axis }: { rows: CountRow[]; axis: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const peak = rows.reduce((a, b) => (b.count > a.count ? b : a), rows[0]);
  return (
    <div>
      <div className="flex h-44 items-end gap-1.5 sm:gap-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end" title={`${axis} ${r.label}: ${n(r.count)}`}>
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
function EventTimeline({ events, t, name }: { events: GrassrootsEvent[]; t: Dict; name: (th: string) => string }) {
  const months = [...new Set(events.map((e) => e.date.slice(0, 7)))];
  const max = Math.max(1, ...events.map((e) => e.coaches));
  return (
    <ol className="space-y-6">
      {months.map((m) => (
        <li key={m} className="grid grid-cols-1 gap-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
          <p className={`${g} text-xl font-medium`} style={{ color: C.green }}>
            {monthLabel(`${m}-01`, t.locale)}
          </p>
          <ul className="max-w-2xl space-y-2 border-l-2 pl-4" style={{ borderColor: C.yellow }}>
            {events
              .filter((e) => e.date.startsWith(m))
              .map((e) => (
                <li key={`${e.date}-${e.province}`} className="grid grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,10rem)] items-center gap-3 text-sm">
                  <span className={`${g} font-medium tabular-nums`} style={{ color: C.ink }}>
                    {dayLabel(e.date, t.locale)}
                  </span>
                  <span className="truncate font-medium text-slate-800">{name(e.province)}</span>
                  <span className="flex items-center gap-2">
                    <span className="block h-2 flex-1 rounded-full" style={{ background: C.sand }}>
                      <span className="block h-full rounded-full" style={{ width: `${(e.coaches / max) * 100}%`, background: C.grass }} />
                    </span>
                    <span className="w-16 flex-none text-right text-xs tabular-nums text-slate-600">
                      {n(e.coaches)} {t.coachesShort}
                    </span>
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
// ตัวเลขรายปีอยู่ใน src/lib/grassroots.ts · ?year=2025 = ดูปีอื่น · ?lang=en = ภาษาอังกฤษ · ส่วนที่ปีนั้นไม่มีข้อมูลจะไม่แสดง
export default async function GrassrootsFootballPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const lang = langOf(sp.lang);
  const t = T[lang];
  const en = lang === "en";
  const { report, years } = getGrassroots(Number(sp.year) || undefined);
  const { players, coaches, detail } = report;
  const year = report.year;
  const label = (s: string) => (en ? labelEn(s) : s);
  const province = (th: string) => (en ? provinceEnByName(th) : th);
  const withLang = (y: number) => `/grassroots-football?${new URLSearchParams({ year: String(y), ...(en ? { lang: "en" } : {}) })}#stats`;

  // ใบอนุญาตของผู้ฝึกสอนในโครงการ — ส่วนที่เหลือจากรายการหลัก = ระดับอื่นๆ ที่ไม่ได้แยกไว้
  const licensed = coaches.licenses.reduce((s, l) => s + l.count, 0);
  const otherLicences = Math.max(0, coaches.total - coaches.noLicense - licensed);
  const licenceMix = [
    ...coaches.licenses.map((l, i) => ({ label: l.label, count: l.count, color: LICENCE_COLORS[i % LICENCE_COLORS.length], gender: detail?.coachLicenceGender.find((x) => x.label === l.label) })),
    ...(otherLicences > 0 ? [{ label: t.otherLevels, count: otherLicences, color: "#a7f3d0", gender: undefined }] : []),
    { label: t.noLicence, count: coaches.noLicense, color: "#d9d2c3", gender: undefined },
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
    { v: report.provinces, label: t.kpi.provinces },
    ...(detail
      ? [
          { v: detail.events.length, label: t.kpi.events },
          { v: detail.playerSchools, label: t.kpi.schools },
          { v: detail.coachOrganisations, label: t.kpi.orgs },
          { v: detail.coachFirstTime, label: t.kpi.firstTime },
        ]
      : [{ v: coaches.total - coaches.noLicense, label: t.kpi.licensed }]),
  ];
  const ageRows: { label: string; count: number; male?: number; female?: number }[] = detail
    ? detail.playerAgeGender.map((a: GenderRow) => ({ label: label(a.label), count: a.male + a.female, male: a.male, female: a.female }))
    : players.ageRanges.map((a) => ({ label: label(a.label), count: a.count }));
  const ageMax = Math.max(1, ...ageRows.map((a) => a.count));
  const peakAge = ageRows.length ? ageRows.reduce((a, b) => (b.count > a.count ? b : a)) : null;

  const nav = [
    { href: "#principles", label: t.nav.principles },
    { href: "#stats", label: `${t.nav.overview} ${year}` },
    { href: "#players", label: t.nav.players },
    { href: "#coaches", label: t.nav.coaches },
    { href: "#map", label: t.nav.provinces },
    ...(detail?.events.length ? [{ href: "#events", label: t.nav.events }] : []),
  ];
  const ribbon = [...t.pillars.map(([title]) => title), "Grassroots Football", t.season(year)];

  return (
    <div lang={lang} className="min-h-screen overflow-x-clip text-slate-900" style={{ background: C.cream }}>
      {/* ===== แถบบน ===== */}
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
          <Link href={en ? "/grassroots-football?lang=en" : "/grassroots-football"} className="flex min-w-0 items-center gap-3">
            <span className="relative h-10 w-10 flex-none overflow-hidden rounded-lg">
              <Image src={GRASSROOTS_LOGO_URL} alt="" fill sizes="40px" className="object-contain" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className={`${g} block truncate text-lg font-medium`} style={{ color: C.green }}>
                Grassroots Football
              </span>
              <span className="block truncate text-[11px] text-slate-500">{t.logoSub}</span>
            </span>
          </Link>
          <nav aria-label="Grassroots" className={`${g} hidden flex-1 items-center justify-center gap-6 text-[15px] text-slate-600 lg:flex`}>
            {nav.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-[#ff6b1a]">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex flex-none items-center gap-2 sm:gap-3">
            <LangSwitch lang={lang} year={year} />
            <BrandLogo tone="navy" className="hidden h-9 sm:block" />
            <HomeButton lang={lang} />
          </div>
        </div>
      </header>

      {/* ===== ฮีโร่ ===== */}
      <section className="px-4 pb-20 pt-12 sm:px-6 lg:pt-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div>
            <p className={`${g} flex items-center gap-2 text-base font-medium`} style={{ color: C.orange }}>
              <Ball className="h-5 w-5 text-[#ff6b1a]" />
              {t.heroKicker(year)}
            </p>
            <h1 className={`${g} mt-4 font-semibold leading-[0.95] ${en ? "text-[3.6rem] sm:text-[7rem]" : "text-[4.5rem] sm:text-[8.5rem]"}`}>
              <span className="block" style={{ color: C.green }}>
                {t.heroTitle[0]}
              </span>
              <span className="block" style={{ color: C.orange }}>
                {t.heroTitle[1]}
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-slate-700 sm:text-lg">{t.heroIntro}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#stats" className={`${g} inline-flex h-12 items-center gap-2 rounded-xl px-6 text-base font-medium text-white`} style={{ background: C.green }}>
                {t.heroStats(year)}
                <ArrowDown className="h-4 w-4" />
              </a>
              <a href="#map" className={`${g} inline-flex h-12 items-center rounded-xl border-2 px-6 text-base font-medium`} style={{ borderColor: C.green, color: C.green }}>
                {t.heroArea(report.provinces)}
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="-rotate-2 rounded-[1.75rem] border-[10px] border-white bg-white shadow-xl">
              <div className="relative aspect-4/3 overflow-hidden rounded-[1.1rem]">
                <Image src={grassrootsBg} alt={t.photoAlt} fill priority placeholder="blur" sizes="(min-width: 1024px) 36rem, 100vw" className="object-cover object-[45%_40%]" />
              </div>
            </div>
            {/* สติกเกอร์ตัวเลข */}
            <div
              className={`${styles.sticker} absolute -left-3 -top-8 flex h-32 w-32 -rotate-12 flex-col items-center justify-center rounded-full text-center shadow-lg sm:-left-8 sm:h-36 sm:w-36`}
              style={{ background: C.yellow, color: C.ink }}
            >
              <span className={`${g} text-4xl font-semibold leading-none`}>{n(players.total)}</span>
              <span className={`${g} mt-1 text-sm`}>{t.stickerPlayers}</span>
            </div>
            <div className={`${styles.sticker} absolute -bottom-6 right-2 rotate-3 rounded-2xl px-5 py-3 text-white shadow-lg sm:right-6`} style={{ background: C.green }}>
              <span className={`${g} text-3xl font-semibold`}>{n(coaches.total)}</span>
              <span className={`${g} ml-2 text-sm`}>{t.stickerCoaches}</span>
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
                {ribbon.map((r) => (
                  <span key={r} className={`${g} flex items-center gap-6 whitespace-nowrap px-6 text-xl font-medium sm:text-2xl`}>
                    {r}
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
            {t.pillarsTitle[0]}
            <span className="whitespace-nowrap">{t.pillarsTitle[1]}</span>
          </h2>
          <p className="mt-2 text-slate-600">{t.pillarsSub}</p>
          <ol className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.pillars.map(([title, description], i) => (
              <li key={title}>
                <Reveal delay={i * 90} className="h-full">
                  <div className="flex h-full min-h-64 flex-col rounded-[1.5rem] p-7 transition-transform duration-300 hover:-rotate-1 hover:-translate-y-1" style={{ background: PILLAR_STYLE[i].bg, color: PILLAR_STYLE[i].fg }}>
                    <span className={`${g} text-6xl font-semibold leading-none opacity-90`}>{String(i + 1).padStart(2, "0")}</span>
                    <h3 className={`${g} mt-auto pt-10 text-2xl font-semibold`}>{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed opacity-90">{description}</p>
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
              <h2 className={`${g} mt-1 text-4xl font-semibold sm:text-5xl`}>{t.statsTitle(year)}</h2>
              <p className="mt-2 text-white/75">{t.statsSub}</p>
            </div>
            {/* เลือกปี (แสดงเมื่อมีมากกว่า 1 ปี) */}
            {years.length > 1 && (
              <nav aria-label={t.chooseYear} className="flex flex-wrap gap-2">
                {years.map((y) => (
                  <Link
                    key={y}
                    href={withLang(y)}
                    scroll={false}
                    aria-current={y === year ? "page" : undefined}
                    className={`${g} inline-flex min-h-11 items-center rounded-full px-5 text-base font-medium transition-colors ${y === year ? "text-[#0b2a1a]" : "bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/20"}`}
                    style={y === year ? { background: C.yellow } : undefined}
                  >
                    {t.yearLabel(y)}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* ป้ายสกอร์ */}
          <Reveal className="mt-10 overflow-hidden rounded-[1.5rem] bg-[#06331d] ring-1 ring-white/10">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-5 py-8 text-center sm:px-10">
              {[
                { label: t.players, total: players.total, m: players.male, f: players.female },
                { label: t.coaches, total: coaches.total, m: coaches.male, f: coaches.female },
              ].map((x, i) => (
                <div key={x.label} style={{ gridColumn: i === 0 ? 1 : 3 }}>
                  <p className={`${g} text-sm text-white/70 sm:text-base`}>{x.label}</p>
                  <p className={`${g} text-5xl font-semibold tabular-nums sm:text-8xl`} style={{ color: C.yellow }}>
                    {n(x.total)}
                  </p>
                  <p className="mt-1 text-xs text-white/70 sm:text-sm">{t.mf(x.m, x.f)}</p>
                </div>
              ))}
              <span className={`${g} row-start-1 text-3xl text-white/40 sm:text-6xl`} style={{ gridColumn: 2 }}>
                :
              </span>
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
          <SectionHead kicker={`Players · ${year}`} title={t.playersTitle(players.total)} sub={t.playersSub} />
          <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <Card title={t.genderCard}>
              <PairSplit
                items={[
                  { label: t.male, v: players.male, color: MALE_INK },
                  { label: t.female, v: players.female, color: FEMALE_INK },
                ]}
              />
            </Card>
            <Card title={t.ageCard} note={peakAge ? t.agePeak(peakAge.label, peakAge.count, pctOf(peakAge.count, players.total)) : undefined}>
              {detail && (
                <div className="mb-4 flex justify-end">
                  <GenderLegend t={t} />
                </div>
              )}
              <BarRows rows={ageRows} max={ageMax} t={t} />
              {detail && (
                <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-black/5 pt-3 text-xs text-slate-600 sm:grid-cols-3">
                  {detail.playerAgeGender.map((a) => (
                    <li key={a.label} className="tabular-nums">
                      {label(a.label)}: {t.short(a.male, a.female)}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            {detail && (
              <Card title={t.singleAgeCard} note={t.singleAgeNote(detail.playerAgeUnclear)} className="lg:col-span-2">
                <Columns rows={detail.playerSingleAges} axis={t.ageAxis} />
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* ===== ผู้ฝึกสอน ===== */}
      <section id="coaches" className="scroll-mt-16 bg-white px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionHead kicker={`Coaches · ${year}`} title={t.coachesTitle(coaches.total)} sub={t.coachesSub} />
          <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card title={t.genderCard} className="bg-[#fffbf3]">
              <PairSplit
                items={[
                  { label: t.male, v: coaches.male, color: MALE_INK },
                  { label: t.female, v: coaches.female, color: FEMALE_INK },
                ]}
              />
            </Card>
            <Card title={t.licenceCard} note={t.licensedNote(coaches.total - coaches.noLicense, pctOf(coaches.total - coaches.noLicense, coaches.total))} className="bg-[#fffbf3]">
              <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-full">
                {licenceMix.map((l) => (
                  <span key={l.label} title={`${l.label}: ${n(l.count)}`} style={{ width: widthOf(l.count, coaches.total), minWidth: l.count ? 3 : 0, background: l.color }} />
                ))}
              </div>
              <ul className="mt-4 divide-y divide-black/5">
                {licenceMix.map((l) => (
                  <li key={l.label} className="flex items-center gap-3 py-2 text-sm">
                    <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: l.color }} />
                    <span className="flex-1 text-slate-700">
                      {l.label}
                      {l.gender && <span className="ml-2 text-xs tabular-nums text-slate-500">{t.short(l.gender.male, l.gender.female)}</span>}
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
              <Card title={t.ageCard} note={t.coachAgeNote(detail.coachAverageAge)} className="bg-[#fffbf3]">
                <BarRows rows={detail.coachAges.map((a) => ({ label: label(a.label), count: a.count }))} max={Math.max(1, ...detail.coachAges.map((a) => a.count))} t={t} />
              </Card>
            )}
            {detail && (
              <Card title={t.historyCard} note={t.historyNote} className="bg-[#fffbf3]">
                <PairSplit
                  items={[
                    { label: t.firstTime, v: detail.coachFirstTime, color: C.orange },
                    { label: t.returning, v: detail.coachReturning, color: C.grass },
                  ]}
                />
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* ===== จังหวัด: แผนที่ + รายการทุกจังหวัด ===== */}
      <section id="map" className="scroll-mt-16 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionHead kicker={`Provinces · ${year}`} title={t.mapTitle(report.provinces)} sub={allProvinces ? t.mapSubAll(players.byProvince.length) : t.mapSubTop} />
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)_minmax(0,1fr)]">
            <figure className="mx-auto w-full max-w-sm rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5 lg:sticky lg:top-24 lg:self-start">
              <ProvinceMap
                values={mapValues}
                bins={MAP_BINS}
                colors={MAP_COLORS}
                zero="#efe7d6"
                unit={en ? "players" : "คน"}
                markers={markers}
                markerColor={C.green}
                lang={lang}
                title={t.mapAria(allProvinces, year)}
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
                  {allProvinces ? t.noData : t.notTop5}
                </span>
              </figcaption>
            </figure>
            <Card title={t.playersProv(players.byProvince.length, allProvinces)} note={players.byProvince.some((p) => p.male != null) ? t.mfKey : undefined}>
              <ProvinceList rows={players.byProvince} total={players.total} unplaced={report.unplacedPlayers} t={t} name={province} />
            </Card>
            <Card title={t.coachesProv(coaches.byProvince.length, coaches.byProvince.length > 5)}>
              <ProvinceList rows={coaches.byProvince} total={coaches.total} unplaced={report.unplacedCoaches} t={t} name={province} />
            </Card>
          </div>
        </div>
      </section>

      {/* ===== ไทม์ไลน์กิจกรรม ===== */}
      {detail && detail.events.length > 0 && (
        <section id="events" className="scroll-mt-16 bg-white px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <SectionHead kicker={`Activities · ${year}`} title={t.eventsTitle(detail.events.length)} sub={t.eventsSub} />
            <div className="mt-10">
              <EventTimeline events={detail.events} t={t} name={province} />
            </div>
          </div>
        </section>
      )}

      <p className="mx-auto max-w-7xl px-4 py-8 text-xs leading-relaxed text-slate-500 sm:px-6">
        {t.source(en ? report.sourceEn : report.source)}
        {detail && t.method}
      </p>

      <footer className="px-4 py-10 text-white sm:px-6" style={{ background: C.green }}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-3">
            <BrandLogo tone="white" className="h-9" />
            <span className={`${g} text-lg`}>Grassroots Football</span>
          </span>
          <span className="text-white/70">{t.footer}</span>
        </div>
      </footer>
    </div>
  );
}
