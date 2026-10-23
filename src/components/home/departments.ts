import type { LucideIcon } from "lucide-react";
import { Database, GraduationCap, ShieldCheck, Sparkles, Sprout, Target, Trophy } from "lucide-react";
import {
  COACH_CENTRE_IMAGE_URL,
  G15_IMAGE_URL,
  GRASSROOTS_LOGO_URL,
  PLAY_AND_LEARN_LOGO_URL,
  PLAY_AND_LEARN_MASCOT,
  TALENT_ID_LOGO_URL,
} from "@/lib/brand";

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
  badge?: string;
  image?: string;
  // ภาพตกแต่งมุมขวาล่าง (พื้นโปร่งใส เช่น มาสคอต) · ตัวอักษรใหญ่จางๆ เป็นลายพื้น
  art?: string;
  mark?: string;
  // สีพื้นการ์ด (ใช้เมื่อไม่มีภาพ หรือเป็นสีทับภาพ)
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
    image: COACH_CENTRE_IMAGE_URL,
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
    mark: "G15",
    tone: "bg-g15-900",
  },
  {
    key: "academy",
    title: "Academy Licensing",
    subtitle: "ทำเนียบอคาเดมีที่ได้รับการรับรอง Bronze · Silver · Gold",
    href: "/academies",
    public: true,
    icon: ShieldCheck,
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
    art: PLAY_AND_LEARN_MASCOT.wave,
    tone: "bg-rose-500",
  },
  {
    key: "grassroots",
    title: "Grassroots Football",
    subtitle: "ฟุตบอลรากหญ้า ปูพื้นฐานเยาวชนทั่วประเทศ",
    href: "/grassroots-football",
    public: false,
    icon: Sprout,
    badge: GRASSROOTS_LOGO_URL,
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
    tone: "bg-amber-600",
  },
  {
    key: "data",
    title: "FA Thailand Data Center",
    subtitle: "ศูนย์รวมข้อมูลการฝึกอบรมและงานเทคนิคของสมาคมฯ",
    href: "/training-centre",
    public: false,
    icon: Database,
    tone: "bg-sky-800",
  },
];

export const departmentHref = (d: Department, loggedIn: boolean) => (d.public || loggedIn ? d.href : (d.guestHref ?? "/login"));
