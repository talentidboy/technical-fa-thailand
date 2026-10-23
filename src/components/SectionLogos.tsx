import Image from "next/image";
import academyLogo from "@/assets/sections/academy-logo.png";
import coachLogo from "@/assets/sections/coach-centre-logo.png";
import coachLogoWhite from "@/assets/sections/coach-centre-logo-white.png";
import dataCentreLogo from "@/assets/sections/data-centre-logo.png";

// โลโก้ประจำหมวดงาน (ไฟล์อยู่ที่ src/assets/sections/) — กำหนดความสูงผ่าน className ความกว้างตามสัดส่วนโลโก้

// Academy Licensing: ป้ายพื้นขาวมุมโค้ง ใช้ได้ทั้งบนพื้นสว่างและพื้นเข้ม
export function AcademyLogo({ className = "h-9" }: { className?: string }) {
  return <Image src={academyLogo} alt="Academy Licensing" className={`w-auto flex-none ${className}`} />;
}

// Technical Data & Articles Centre (ศูนย์ข้อมูลและบทความด้านเทคนิค): ลูกฟุตบอล + หนังสือ พื้นโปร่งใส ใช้บนพื้นสว่าง
export function DataCentreLogo({ className = "h-9" }: { className?: string }) {
  return <Image src={dataCentreLogo} alt="Technical Data & Articles Centre" className={`w-auto flex-none ${className}`} />;
}

// ศูนย์อบรมผู้ฝึกสอนฟุตบอล (AFC) — tone="white" บนพื้นเข้ม · tone="navy" บนพื้นสว่าง
export function CoachCentreLogo({ tone = "navy", className = "h-6" }: { tone?: "white" | "navy"; className?: string }) {
  return <Image src={tone === "white" ? coachLogoWhite : coachLogo} alt="AFC — ศูนย์อบรมผู้ฝึกสอนฟุตบอล" className={`w-auto flex-none ${className}`} />;
}
