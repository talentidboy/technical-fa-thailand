import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { AdminTabs } from "@/components/AdminTabs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "COACH") redirect("/me");

  const pendingRequestCount =
    user.role === "ADMIN"
      ? await prisma.profileEditRequest.count({ where: { status: "PENDING" } })
      : 0;

  return (
    <div className="flex h-full">
      <Sidebar
        email={user.email}
        role={user.role}
        pendingRequestCount={pendingRequestCount}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-10">
          <AdminTabs role={user.role} pendingRequestCount={pendingRequestCount} />
          {children}
        </div>
      </main>
    </div>
  );
}
