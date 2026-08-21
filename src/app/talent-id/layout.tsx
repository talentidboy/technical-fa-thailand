import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { TalentIdSidebar } from "@/components/talent-id/TalentIdSidebar";
import { TalentIdMobileNav } from "@/components/talent-id/TalentIdMobileNav";
import { TalentIdMobileHeader } from "@/components/talent-id/TalentIdMobileHeader";

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

export default async function TalentIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-indigo-950 text-white">
      <TalentIdSidebar email={user.email} roleLabel={ROLE_LABELS[user.role] ?? user.role} />
      <div className="flex min-h-screen flex-1 flex-col">
        <TalentIdMobileHeader />
        <main className="relative flex-1 overflow-x-hidden pb-20 lg:pb-0">
          <div className="pointer-events-none absolute -left-24 -top-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 top-40 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
            {children}
          </div>
        </main>
      </div>
      <TalentIdMobileNav />
    </div>
  );
}
