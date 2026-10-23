import type { StaticImageData } from "next/image";
import type { LucideIcon } from "lucide-react";
import { Database, GraduationCap, ShieldCheck, Sparkles, Sprout, Target, Trophy } from "lucide-react";
import { G15_IMAGE_URL, GRASSROOTS_LOGO_URL, PLAY_AND_LEARN_LOGO_URL, TALENT_ID_LOGO_URL } from "@/lib/brand";
import { academyBg, coachCentreBg, dataCenterBg, g15Bg, grassrootsBg, playAndLearnBg, talentIdBg } from "@/lib/section-images";
import academyLogo from "@/assets/sections/academy-logo.png";
import coachCentreLogo from "@/assets/sections/coach-centre-logo.png";
import dataCentreLogo from "@/assets/sections/data-centre-logo.png";

// หมวดงานของฝ่ายเทคนิค — ใช้ทั้งหน้าแรก (การ์ด) และเมนูบน (เมนูหมวดงาน)
export type Department = {
  key: string;
  title: string;
  subtitle: string;
  href: string;
  // ยังไม่ล็อกอิน → ลิงก์นี้แทน (หน้าที่ต้องล็อกอินจะพาไปหน้าเข้าสู่ระบบอยู่แล้ว)
  guestHref?: string;
  // เปิดให้บุคคลทั่วไปเข้าได้ (ดู src/proxy.ts)
  public: boolean;
  icon: LucideIcon;
  // โลโก้สี่เหลี่ยมเล็ก (การ์ด + เมนู) · โลโก้แนวนอน (การ์ดเท่านั้น, logoBoxed = วางบนกล่องขาว สำหรับโลโก้ที่ไม่มีพื้นของตัวเอง)
  badge?: string | StaticImageData;
  logo?: StaticImageData;
  logoBoxed?: boolean;
  // ภาพพื้นหลังการ์ด + ตำแหน่งจุดสนใจของภาพ (object-position)
  image?: string | StaticImageData;
  imagePosition?: string;
  // สีประจำหมวด (เข้ม) — ไล่ทับภาพจากล่างขึ้นบนให้ตัวอักษรบนการ์ดอ่านง่ายทุกภาพ
  hex: string;
  // สีไอคอนหมวดในเมนูบน (คลาส Tailwind)
  tone: string;
};

export const DEPARTMENTS: Department[] = [
  {
    key: "coach",
    title: "ศูนย์อบรมผู้ฝึกสอนฟุตบอล",
    subtitle: "ใบอนุญาตผู้ฝึกสอน AFC · หลักสูตรอบรม · ทำเนียบวิทยากร · บัตรประจำตัวดิจิทัล",
    href: "/dashboard",
    guestHref: "/coach-center",
    public: false,
    icon: GraduationCap,
    badge: coachCentreLogo,
    logo: coachCentreLogo,
    logoBoxed: true,
    image: coachCentreBg,
    imagePosition: "50% 25%",
    hex: "#04223a",
    tone: "bg-[#073c5e]",
  },
  {
    key: "g15",
    title: "G15 Women's Football Series 2026",
    subtitle: "ตาราง ผลการแข่งขัน และสถิติฟุตบอลหญิงรุ่นอายุไม่เกิน 15 ปี",
    href: "/g15-womens-series",
    public: true,
    icon: Trophy,
    badge: G15_IMAGE_URL,
    image: g15Bg,
    imagePosition: "50% 45%",
    hex: "#210d4f",
    tone: "bg-g15-900",
  },
  {
    key: "academy",
    title: "Academy Licensing",
    subtitle: "ทำเนียบอคาเดมีที่ได้รับการรับรอง Bronze · Silver · Gold",
    href: "/academies",
    public: true,
    icon: ShieldCheck,
    logo: academyLogo,
    image: academyBg,
    imagePosition: "50% 20%",
    hex: "#0b1f44",
    tone: "bg-[#0b1f44]",
  },
  {
    key: "play",
    title: "Play and Learn",
    subtitle: "ฟุตบอลสำหรับเด็กหญิงวัย 5–8 ปี กับ “กุ๋งกิ๋ง”",
    href: "/play-and-learn",
    public: true,
    icon: Sparkles,
    badge: PLAY_AND_LEARN_LOGO_URL,
    image: playAndLearnBg,
    imagePosition: "50% 85%",
    hex: "#881337",
    tone: "bg-rose-500",
  },
  {
    key: "grassroots",
    title: "Grassroots Football",
    subtitle: "ฟุตบอลรากหญ้า ปูพื้นฐานเยาวชนทั่วประเทศ",
    href: "/grassroots-football",
    public: true,
    icon: Sprout,
    badge: GRASSROOTS_LOGO_URL,
    image: grassrootsBg,
    imagePosition: "50% 35%",
    hex: "#064e3b",
    tone: "bg-emerald-700",
  },
  {
    key: "talent",
    title: "Talent ID",
    subtitle: "สืบค้นและคัดกรองนักฟุตบอลดาวรุ่น",
    href: "/talent-id",
    public: false,
    icon: Target,
    badge: TALENT_ID_LOGO_URL,
    image: talentIdBg,
    imagePosition: "50% 60%",
    hex: "#0b1b34",
    tone: "bg-amber-600",
  },
  {
    key: "data",
    title: "Technical Data & Articles Centre",
    subtitle: "ศูนย์ข้อมูลและบทความด้านเทคนิค ของฝ่ายเทคนิค สมาคมฯ",
    href: "/training-centre",
    public: true,
    icon: Database,
    badge: dataCentreLogo,
    image: dataCenterBg,
    imagePosition: "50% 29%",
    hex: "#0c4a6e",
    tone: "bg-sky-800",
  },
];

export const departmentHref = (d: Department, loggedIn: boolean) => (d.public || loggedIn ? d.href : (d.guestHref ?? "/login"));
