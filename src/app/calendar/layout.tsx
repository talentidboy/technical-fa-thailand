import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminFrame, GENERAL_ITEMS } from "@/components/admin/AdminFrame";

// ระบบจัดการทั่วไป (ข่าว / ปฏิทิน / ผู้ใช้งาน): แถบซ้ายแบบเดียวกับทุกหมวด
export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "STAFF") redirect("/");
  return (
    <AdminFrame area="calendar" title="ปฏิทินงาน" user={user} items={GENERAL_ITEMS(user.role === "ADMIN")} publicHref="/" publicLabel="ดูหน้าแรกของเว็บ">
      {children}
    </AdminFrame>
  );
}
