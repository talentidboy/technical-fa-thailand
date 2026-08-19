import Link from "next/link";
import { requireCoach } from "@/lib/auth";
import { getCoachCardData } from "@/lib/coach-card-data";
import { getOrigin } from "@/lib/origin";
import { CoachCard } from "@/components/CoachCard";
import { ArrowLeft } from "lucide-react";

export default async function MyCardPage() {
  const user = await requireCoach();
  const origin = await getOrigin();
  const data = await getCoachCardData(user.coachId!, origin);

  if (!data) {
    return <p className="text-sm text-red-600">ไม่พบข้อมูลผู้ฝึกสอนของคุณ</p>;
  }

  const { coach, licenseLabel, qrDataUrl } = data;

  return (
    <div className="space-y-6">
      <Link
        href="/me"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปโปรไฟล์ของฉัน
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <CoachCard
          name={`${coach.nameTh} ${coach.surnameTh}`}
          afcId={coach.afcId ?? ""}
          photoUrl={coach.photoUrl}
          licenseLabel={licenseLabel}
          residence={coach.residence ?? "-"}
          qrDataUrl={qrDataUrl}
        />
      </div>
    </div>
  );
}
