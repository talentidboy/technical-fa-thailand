import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { approveProfileEditRequest, rejectProfileEditRequest } from "./actions";
import { Check, X, Inbox } from "lucide-react";

const FIELD_LABEL: Record<string, string> = {
  email: "อีเมล",
  telNo: "เบอร์โทร",
  residence: "จังหวัดที่พำนัก",
  nationality: "สัญชาติ",
};

export default async function RequestsPage() {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/dashboard");

  const requests = await prisma.profileEditRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { coach: true },
  });

  const pending = requests.filter((r) => r.status === "PENDING");
  const resolved = requests.filter((r) => r.status !== "PENDING").slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          คำขอแก้ไขข้อมูลจากผู้ฝึกสอน
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          ตรวจสอบและอนุมัติคำขอแก้ไขข้อมูลที่โค้ชส่งมาจากหน้าโปรไฟล์ของตนเอง
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {pending.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Inbox className="h-6 w-6" />
            </div>
            <p className="text-sm text-slate-500">ไม่มีคำขอที่รอตรวจสอบ</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pending.map((req) => {
              const changes = JSON.parse(req.payload) as Record<
                string,
                string
              >;
              const fields = Object.entries(changes);
              return (
                <li key={req.id} className="px-6 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {req.coach.nameTh} {req.coach.surnameTh}
                      </p>
                      {fields.length > 0 && (
                        <ul className="mt-2 space-y-1 text-sm text-slate-600">
                          {fields.map(([field, value]) => (
                            <li key={field}>
                              <span className="text-slate-400">
                                {FIELD_LABEL[field] ?? field}:
                              </span>{" "}
                              {value || "(ลบค่าเดิม)"}
                            </li>
                          ))}
                        </ul>
                      )}
                      {req.message && (
                        <p className="mt-2 text-sm italic text-slate-500">
                          “{req.message}”
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <form action={approveProfileEditRequest}>
                        <input type="hidden" name="id" value={req.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                        >
                          <Check className="h-3.5 w-3.5" />
                          อนุมัติ
                        </button>
                      </form>
                      <form action={rejectProfileEditRequest}>
                        <input type="hidden" name="id" value={req.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          ปฏิเสธ
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {resolved.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-slate-900">ประวัติที่ตรวจสอบแล้ว</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {resolved.map((req) => (
              <li
                key={req.id}
                className="flex items-center justify-between px-6 py-3 text-sm"
              >
                <span className="text-slate-600">
                  {req.coach.nameTh} {req.coach.surnameTh}
                </span>
                <span
                  className={
                    req.status === "APPROVED"
                      ? "text-emerald-600"
                      : "text-red-600"
                  }
                >
                  {req.status === "APPROVED" ? "อนุมัติแล้ว" : "ปฏิเสธ"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
