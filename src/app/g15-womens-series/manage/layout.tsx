import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminFrame } from "@/components/admin/AdminFrame";

// ระบบจัดการ G15: แถบซ้ายแบบเดียวกับทุกหมวด
export default async function G15ManageLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "STAFF") redirect("/g15-womens-series");
  return (
    <AdminFrame
      area="g15"
      title="G15 Women's Series"
      user={user}
      publicHref="/g15-womens-series"
      publicLabel="ดูหน้าเว็บ G15"
      items={[
        { href: "/g15-womens-series/manage", label: "ทีมและผลการแข่งขัน", icon: "trophy", match: ["/g15-womens-series/manage/matches", "/g15-womens-series/manage/teams"] },
        { href: "/g15-womens-series/manage/awards", label: "รางวัล", icon: "award" },
        { href: "/g15-womens-series/manage/countdown", label: "Official Countdown", icon: "timer" },
      ]}
    >
      {children}
    </AdminFrame>
  );
}
