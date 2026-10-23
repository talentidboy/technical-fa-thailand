import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { TalentIdTopBar } from "@/components/talent-id/TalentIdTopBar";
import { TalentIdMobileNav } from "@/components/talent-id/TalentIdMobileNav";

// สำคัญ: getCurrentUser() อ่าน cookies() ก่อนหน้านี้เสมอ (auth guard) ทำให้ fetch ของ Airtable
// ที่เรียกทีหลังถูกจัดเป็น "หลัง Request-time API" — ค่า default ของ Next.js คือไม่ cache ให้
// เลย ไม่ว่าจะตั้ง next.revalidate ไว้เท่าไหร่ก็ตาม ผลคือทุกครั้งที่เข้าเพจต้องดึงข้อมูล
// ผู้เล่นทั้งหมด (~400 คน แบ่งหน้าละ 100) จาก Airtable ใหม่หมด นี่คือสาเหตุที่หน้าหน่วงตลอด
// ตั้ง fetchCache = 'default-cache' เพื่อให้ next.revalidate ที่ระบุไว้ใน fetch แต่ละครั้ง
// มีผลจริง แม้จะถูกเรียกหลัง cookies() ก็ตาม
export const fetchCache = "default-cache";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "ผู้ดูแลระบบ",
  STAFF: "เจ้าหน้าที่",
  COACH: "ผู้ฝึกสอน",
};

// ธีม "ห้องวิเคราะห์" ของ Talent ID: เปลี่ยนชุดสี indigo เป็นเทาถ่าน + เหลือง amber สดขึ้น เฉพาะภายในหมวดนี้
// (ทุกหน้า/คอมโพเนนต์ของ Talent ID ใช้คลาส indigo-* / amber-* อยู่แล้ว จึงเปลี่ยนทั้งหมวดได้จากจุดเดียว)
const SCOUT_THEME = {
  "--color-indigo-50": "#f4f5f7",
  "--color-indigo-100": "#e6e9ee",
  "--color-indigo-200": "#cdd3dc",
  "--color-indigo-300": "#a6b0bf",
  "--color-indigo-400": "#7b8698",
  "--color-indigo-500": "#4a5466",
  "--color-indigo-600": "#323a47",
  "--color-indigo-700": "#232a35",
  "--color-indigo-800": "#171c25",
  "--color-indigo-900": "#0f131a",
  "--color-indigo-950": "#07090d",
  "--color-amber-200": "#fef08a",
  "--color-amber-300": "#fde047",
  "--color-amber-400": "#facc15",
} as React.CSSProperties;

export default async function TalentIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div style={SCOUT_THEME} className="min-h-screen bg-indigo-950 text-white">
      <TalentIdTopBar email={user.email} roleLabel={ROLE_LABELS[user.role] ?? user.role} />
      <main className="relative overflow-x-hidden pb-24 md:pb-0">
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
      <TalentIdMobileNav />
    </div>
  );
}
