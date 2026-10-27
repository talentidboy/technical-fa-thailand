import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminFrame } from "@/components/admin/AdminFrame";

// ระบบจัดการศูนย์ข้อมูลและบทความ: แถบซ้ายแบบเดียวกับทุกหมวด
export default async function TrainingManageLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "STAFF") redirect("/training-centre");
  return (
    <AdminFrame
      area="data"
      title="ศูนย์ข้อมูลและบทความ"
      user={user}
      publicHref="/training-centre"
      publicLabel="ดูหน้าศูนย์ข้อมูลและบทความ"
      items={[{ href: "/training-centre/manage", label: "บทความทั้งหมด", icon: "book" }]}
    >
      {children}
    </AdminFrame>
  );
}
