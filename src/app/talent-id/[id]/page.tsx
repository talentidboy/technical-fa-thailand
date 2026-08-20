import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTalentPlayerById } from "@/lib/talent-id";
import { LOGO_URL } from "@/lib/brand";
import {
  ArrowLeft,
  Ruler,
  Weight,
  Footprints,
  MapPin,
  School,
  Shield,
  Video,
  Star,
  Phone,
  Mail,
  MessageCircle,
  IdCard,
  StickyNote,
  Tag,
} from "lucide-react";

export default async function TalentIdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const canSeeContact = user.role === "ADMIN" || user.role === "STAFF";

  const { id } = await params;
  const player = await getTalentPlayerById(id);
  if (!player) notFound();

  const stats: { icon: typeof Ruler; label: string; value: string }[] = [
    player.height ? { icon: Ruler, label: "ส่วนสูง", value: `${player.height} ซม.` } : null,
    player.weight ? { icon: Weight, label: "น้ำหนัก", value: `${player.weight} กก.` } : null,
    player.bmi ? { icon: Weight, label: "BMI", value: player.bmi.toFixed(1) } : null,
    player.strongFoot ? { icon: Footprints, label: "เท้าถนัด", value: player.strongFoot } : null,
  ].filter((s): s is { icon: typeof Ruler; label: string; value: string } => s !== null);

  const grades = [
    { label: "เกรด Leg 1", value: player.gradeLeg1 },
    { label: "เกรด Leg 2", value: player.gradeLeg2 },
    { label: "เกรด Camp 2026", value: player.gradeCamp2026 },
    { label: "คะแนนเฉลี่ย Leg 1", value: player.avgRatingLeg1?.toFixed(2) ?? null },
    { label: "คะแนนเฉลี่ย Leg 2", value: player.avgRatingLeg2?.toFixed(2) ?? null },
    { label: "คะแนนเฉลี่ย Camp 2026", value: player.avgRatingCamp2026?.toFixed(2) ?? null },
  ].filter((g) => g.value);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm font-bold text-white">FA Thailand Technical</p>
              <p className="text-[11px] text-indigo-300">หมวด: Talent ID</p>
            </div>
          </Link>
          <Link
            href="/talent-id"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับรายชื่อ
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        {/* Profile header */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-5 p-6">
            {player.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={player.photoUrl}
                alt=""
                className="h-24 w-24 flex-none rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 flex-none items-center justify-center rounded-2xl bg-indigo-100 text-3xl font-semibold text-indigo-700">
                {player.fullNameTh.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900">{player.fullNameTh}</h1>
              <p className="text-sm text-slate-500">
                {[player.fullNameEn, player.nickname && `"${player.nickname}"`]
                  .filter(Boolean)
                  .join(" · ") || "-"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {player.position1 && (
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
                    {player.position1}
                  </span>
                )}
                {player.position2.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
                  >
                    {p}
                  </span>
                ))}
                {player.styleOfPlay && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    {player.styleOfPlay}
                  </span>
                )}
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 border-t border-slate-100 px-6 py-5 sm:grid-cols-4">
            <div className="flex items-center gap-2 text-sm">
              <School className="h-4 w-4 flex-none text-slate-400" />
              <span className="truncate text-slate-600">{player.school || "-"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 flex-none text-slate-400" />
              <span className="truncate text-slate-600">{player.club || "-"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 flex-none text-slate-400" />
              <span className="truncate text-slate-600">
                {[player.province, player.region].filter(Boolean).join(" · ") || "-"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">ปีเกิด</span>
              <span className="text-slate-600">
                {player.yearOfBirth ?? "-"}
                {player.age ? ` (อายุ ${player.age})` : ""}
              </span>
            </div>
          </dl>
        </div>

        {/* สถิติร่างกาย */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"
              >
                <Icon className="h-5 w-5 text-indigo-500" />
                <p className="text-sm font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ความสามารถโดดเด่น + แท็ก */}
        {(player.talent.length > 0 || player.tags.length > 0) && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-indigo-500" />
              <h2 className="font-semibold text-slate-900">ความสามารถโดดเด่น / สถานะการคัดเลือก</h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {player.talent.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600"
                >
                  {t}
                </span>
              ))}
              {player.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* เกรด/คะแนนประเมิน */}
        {grades.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <h2 className="font-semibold text-slate-900">ผลการประเมิน</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {grades.map((g) => (
                <div key={g.label}>
                  <p className="text-xs text-slate-400">{g.label}</p>
                  <p className="font-bold text-slate-900">{g.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* วิดีโอ */}
        {(player.hudlVideoLeg1 || player.hudlVideoLeg2) && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Video className="h-4 w-4 text-indigo-500" />
              <h2 className="font-semibold text-slate-900">วิดีโอ HUDL</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {player.hudlVideoLeg1 && (
                <a
                  href={player.hudlVideoLeg1}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  <Video className="h-4 w-4" />
                  วิดีโอ Leg 1
                </a>
              )}
              {player.hudlVideoLeg2 && (
                <a
                  href={player.hudlVideoLeg2}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  <Video className="h-4 w-4" />
                  วิดีโอ Leg 2
                </a>
              )}
            </div>
          </div>
        )}

        {/* ข้อมูลติดต่อ — เฉพาะ ADMIN/STAFF */}
        {canSeeContact && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm">
            <div className="flex items-center gap-2 border-b border-amber-100 px-6 py-4">
              <IdCard className="h-4 w-4 text-amber-600" />
              <h2 className="font-semibold text-slate-900">
                ข้อมูลติดต่อ (เฉพาะผู้ดูแลระบบ/เจ้าหน้าที่)
              </h2>
            </div>
            <dl className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <IdCard className="h-4 w-4 flex-none text-slate-400" />
                <span className="text-slate-600">{player.idCardNumber || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 flex-none text-slate-400" />
                <span className="text-slate-600">
                  {player.phone || "-"}
                  {player.emergencyPhone && ` (ฉุกเฉิน: ${player.emergencyPhone})`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 flex-none text-slate-400" />
                <span className="text-slate-600">{player.email || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="h-4 w-4 flex-none text-slate-400" />
                <span className="text-slate-600">{player.lineId || "-"}</span>
              </div>
            </dl>
            {player.notes && (
              <div className="flex items-start gap-2 border-t border-amber-100 px-6 py-4 text-sm">
                <StickyNote className="mt-0.5 h-4 w-4 flex-none text-slate-400" />
                <p className="text-slate-600">{player.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
