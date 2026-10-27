import type { LucideIcon } from "lucide-react";
import { CalendarDays, Database, GraduationCap, History, Megaphone, ShieldCheck, Sparkles, Target, Trophy, UsersRound } from "lucide-react";

// ระบบจัดการทุกหมวดของฝ่ายเทคนิค — ใช้ทั้งหน้าศูนย์ควบคุม (/admin) และปุ่มสลับระบบจัดการในหัวของทุกหมวด
export type AdminArea = {
  key: string;
  label: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  hex: string;
  adminOnly?: boolean;
  shortcuts?: { label: string; href: string; adminOnly?: boolean }[];
};

export const ADMIN_AREAS: AdminArea[] = [
  {
    key: "coach",
    label: "ศูนย์อบรมผู้ฝึกสอน",
    desc: "ผู้ฝึกสอน ใบอนุญาต หลักสูตรอบรม การต่ออายุ",
    href: "/dashboard",
    icon: GraduationCap,
    hex: "#04223a",
    shortcuts: [
      { label: "รายชื่อผู้ฝึกสอน", href: "/coaches" },
      { label: "หลักสูตรอบรม", href: "/course-sessions", adminOnly: true },
      { label: "ต่ออายุใบอนุญาต", href: "/renewals", adminOnly: true },
    ],
  },
  {
    key: "academy",
    label: "Academy Licensing",
    desc: "ทะเบียนอคาเดมี ใบอนุญาต ใบสมัคร",
    href: "/academies/manage",
    icon: ShieldCheck,
    hex: "#0b1f44",
    shortcuts: [
      { label: "อคาเดมี", href: "/academies/manage/academies" },
      { label: "ใบสมัคร", href: "/academies/manage/applications" },
      { label: "บัญชีอคาเดมี", href: "/academies/manage/accounts" },
    ],
  },
  {
    key: "g15",
    label: "G15 Women's Series",
    desc: "ทีม นักเตะ ผลการแข่งขัน ถ่ายทอดสด",
    href: "/g15-womens-series/manage",
    icon: Trophy,
    hex: "#210d4f",
    shortcuts: [
      { label: "รางวัล", href: "/g15-womens-series/manage/awards" },
      { label: "นับถอยหลัง", href: "/g15-womens-series/manage/countdown" },
    ],
  },
  { key: "play", label: "Play and Learn", desc: "ข้อความ ศูนย์ฝึก พาสปอร์ต กิจกรรม", href: "/play-and-learn/manage", icon: Sparkles, hex: "#881337" },
  { key: "data", label: "ศูนย์ข้อมูลและบทความ", desc: "เพิ่ม/ลบบทความด้านเทคนิค", href: "/training-centre/manage", icon: Database, hex: "#0c4a6e" },
  { key: "talent", label: "Talent ID", desc: "ข้อมูลนักฟุตบอลเยาวชน (ดูอย่างเดียว)", href: "/talent-id", icon: Target, hex: "#0b1b34" },
  { key: "news", label: "ข่าวประกาศ", desc: "ข่าวบนหน้าแรกของเว็บ", href: "/announcements", icon: Megaphone, hex: "#9a3412" },
  { key: "calendar", label: "ปฏิทินงาน", desc: "กิจกรรมและกำหนดการของฝ่ายฯ", href: "/calendar", icon: CalendarDays, hex: "#155e75" },
  { key: "users", label: "ผู้ใช้งานระบบ", desc: "บัญชีแอดมินและเจ้าหน้าที่", href: "/users", icon: UsersRound, hex: "#334155", adminOnly: true },
  { key: "audit", label: "บันทึกการแก้ไข", desc: "ใครแก้อะไร เมื่อไร", href: "/audit", icon: History, hex: "#475569", adminOnly: true },
];

export const areasFor = (isAdmin: boolean) => ADMIN_AREAS.filter((a) => isAdmin || !a.adminOnly);
