import Link from "next/link";
import { notFound } from "next/navigation";
import { getCoachCardData } from "@/lib/coach-card-data";
import { getOrigin } from "@/lib/origin";
import { CoachCard } from "@/components/CoachCard";
import { formatThaiAddress } from "@/lib/thai-address";
import { ArrowLeft } from "lucide-react";

export default async function CoachCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const origin = await getOrigin();
  const data = await getCoachCardData(Number(id), origin);

  if (!data) notFound();
  const { coach, licenseLabel, qrDataUrl } = data;

  return (
    <div className="space-y-6">
      <Link
        href={`/coaches/${coach.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปหน้าโปรไฟล์
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <CoachCard
          name={`${coach.nameTh} ${coach.surnameTh}`}
          afcId={coach.afcId ?? ""}
          photoUrl={coach.photoUrl}
          licenseLabel={licenseLabel}
          residence={formatThaiAddress(coach) ?? coach.residence ?? "-"}
          qrDataUrl={qrDataUrl}
        />
      </div>
    </div>
  );
}
