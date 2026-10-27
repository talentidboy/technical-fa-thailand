import { AdminSidebar, type AdminNavItem } from "./AdminSidebar";

// โครงหน้าระบบจัดการ: แถบซ้าย (AdminSidebar) + พื้นที่เนื้อหา — ใช้กับทุกหมวดที่ยังไม่มีแถบซ้ายของตัวเอง
export function AdminFrame({
  area,
  title,
  items,
  publicHref,
  publicLabel,
  user,
  children,
}: {
  area: string;
  title: string;
  items: AdminNavItem[];
  publicHref?: string;
  publicLabel?: string;
  user: { email: string; role: string };
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <AdminSidebar area={area} title={title} items={items} publicHref={publicHref} publicLabel={publicLabel} email={user.email} role={user.role} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export type { AdminNavItem };

// เมนูหมวด "ทั่วไป" (ข่าว / ปฏิทิน / ผู้ใช้งาน) ใช้ร่วมกันสามหน้า
export const GENERAL_ITEMS = (isAdmin: boolean): AdminNavItem[] => [
  { href: "/announcements", label: "ข่าวประกาศ", icon: "megaphone" },
  { href: "/calendar", label: "ปฏิทินงาน", icon: "calendar" },
  ...(isAdmin ? [{ href: "/users", label: "ผู้ใช้งานระบบ", icon: "users" as const }] : []),
];
