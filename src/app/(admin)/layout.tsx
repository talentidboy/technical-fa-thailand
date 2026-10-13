import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { AdminTopBar } from "@/components/AdminTopBar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "COACH") redirect("/me");

  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 90);

  const [
    pendingRequestCount,
    pendingRequests,
    coachCount,
    instructorCount,
    courseSessionCount,
    expiringSoon,
    expiringSoonCount,
  ] = await Promise.all([
    user.role === "ADMIN"
      ? prisma.profileEditRequest.count({ where: { status: "PENDING" } })
      : Promise.resolve(0),
    user.role === "ADMIN"
      ? prisma.profileEditRequest.findMany({
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { coach: true },
        })
      : Promise.resolve([]),
    // นับเฉพาะผู้ที่มีใบอนุญาต — คนที่สมัครบัญชีอย่างเดียวไม่นับ
    prisma.coach.count({ where: { licenseRecords: { some: {} } } }),
    prisma.instructor.count(),
    user.role === "ADMIN" ? prisma.courseSession.count() : Promise.resolve(0),
    prisma.licenseRecord.findMany({
      where: { expireDate: { gte: now, lte: ninetyDaysFromNow } },
      orderBy: { expireDate: "asc" },
      take: 5,
      include: { coach: true },
    }),
    prisma.licenseRecord.count({
      where: { expireDate: { gte: now, lte: ninetyDaysFromNow } },
    }),
  ]);

  return (
    <div className="min-h-full bg-slate-50 lg:flex lg:h-full">
      <Sidebar
        email={user.email}
        role={user.role}
        pendingRequestCount={pendingRequestCount}
      />
      <main className="min-w-0 lg:h-screen lg:flex-1 lg:overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
          <AdminTopBar
            role={user.role}
            coachCount={coachCount}
            instructorCount={instructorCount}
            courseSessionCount={courseSessionCount}
            expiringSoonCount={expiringSoonCount}
            expiringSoon={expiringSoon.map((r) => ({
              id: r.id,
              coachId: r.coachId,
              coachName: `${r.coach.nameTh} ${r.coach.surnameTh}`,
              licenseType: r.licenseType,
              expireDate: r.expireDate,
            }))}
            pendingRequestCount={pendingRequestCount}
            pendingRequests={pendingRequests.map((r) => ({
              id: r.id,
              coachName: `${r.coach.nameTh} ${r.coach.surnameTh}`,
              createdAt: r.createdAt,
            }))}
          />
          {children}
        </div>
      </main>
    </div>
  );
}
