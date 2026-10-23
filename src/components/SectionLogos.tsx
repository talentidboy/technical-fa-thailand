import Image from "next/image";
import academyLogo from "@/assets/sections/academy-logo.png";
import coachLogo from "@/assets/sections/coach-centre-logo.png";
import coachLogoWhite from "@/assets/sections/coach-centre-logo-white.png";

// โลโก้ประจำหมวดงาน (ไฟล์อยู่ที่ src/assets/sections/) — กำหนดความสูงผ่าน className ความกว้างตามสัดส่วนโลโก้

// Academy Licensing: ป้ายพื้นขาวมุมโค้ง ใช้ได้ทั้งบนพื้นสว่างและพื้นเข้ม
export function AcademyLogo({ className = "h-9" }: { className?: string }) {
  return <Image src={academyLogo} alt="Academy Licensing" className={`w-auto flex-none ${className}`} />;
}

// ศูนย์อบรมผู้ฝึกสอนฟุตบอล (AFC) — tone="white" บนพื้นเข้ม · tone="navy" บนพื้นสว่าง
export function CoachCentreLogo({ tone = "navy", className = "h-6" }: { tone?: "white" | "navy"; className?: string }) {
  return <Image src={tone === "white" ? coachLogoWhite : coachLogo} alt="AFC — ศูนย์อบรมผู้ฝึกสอนฟุตบอล" className={`w-auto flex-none ${className}`} />;
}
