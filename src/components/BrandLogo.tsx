import Image from "next/image";
import logoNavy from "@/assets/brand/fa-thailand.png";
import logoWhite from "@/assets/brand/fa-thailand-white.png";

// โลโก้ FA Thailand (ไฟล์ทางการ พื้นโปร่งใส) — tone="white" บนพื้นเข้ม · tone="navy" บนพื้นสว่าง
// กำหนดความสูงผ่าน className (เช่น h-9) ความกว้างตามสัดส่วนโลโก้
export function BrandLogo({ tone = "white", className = "h-9", priority = false }: { tone?: "white" | "navy"; className?: string; priority?: boolean }) {
  return <Image src={tone === "white" ? logoWhite : logoNavy} alt="FA Thailand" priority={priority} className={`w-auto flex-none ${className}`} />;
}
