import { DashboardTabs } from "@/components/DashboardTabs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <DashboardTabs />
      {children}
    </div>
  );
}
