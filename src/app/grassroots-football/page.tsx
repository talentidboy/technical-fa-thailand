import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LOGO_URL } from "@/lib/brand";
import {
  ArrowLeft,
  Sprout,
  Heart,
  Users,
  Smile,
  Trophy,
  UserCog,
  MapPin,
} from "lucide-react";

// ข้อมูลสถิติปี 2025 จากรายงานสรุปโครงการฟุตบอลรากหญ้า (ข้อมูลนิ่ง กรอกด้วยมือ ไม่ได้ดึงจากฐานข้อมูล)
const coachStats = {
  total: 518,
  male: 446,
  malePercent: 86.1,
  female: 72,
  femalePercent: 13.9,
  provinces: 18,
  topProvinces: [
    { name: "สุราษฎร์ธานี", count: 107 },
    { name: "ชลบุรี", count: 88 },
    { name: "สงขลา", count: 65 },
    { name: "ภูเก็ต", count: 62 },
    { name: "น่าน", count: 48 },
  ],
  noLicense: 387,
  licenses: [
    { label: "G-Diploma", count: 80 },
    { label: "C-Diploma", count: 27 },
    { label: "T-License", count: 10 },
  ],
};

const playerStats = {
  total: 2888,
  male: 2414,
  malePercent: 83.6,
  female: 474,
  femalePercent: 16.4,
  provinces: 18,
  topProvinces: [
    { name: "สุราษฎร์ธานี", count: 799 },
    { name: "ชลบุรี", count: 487 },
    { name: "สงขลา", count: 267 },
    { name: "ร้อยเอ็ด", count: 148 },
    { name: "น่าน", count: 134 },
  ],
  ageRanges: [
    { label: "2–7 ปี", count: 93 },
    { label: "8–10 ปี", count: 1006 },
    { label: "11–12 ปี", count: 1496 },
    { label: "13–15 ปี", count: 293 },
  ],
};

function GenderSplitBar({
  male,
  malePercent,
  female,
  femalePercent,
}: {
  male: number;
  malePercent: number;
  female: number;
  femalePercent: number;
}) {
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="bg-indigo-500" style={{ width: `${malePercent}%` }} />
        <div className="bg-rose-400" style={{ width: `${femalePercent}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-indigo-700">
          <span className="h-2 w-2 flex-none rounded-full bg-indigo-500" />
          ชาย {male.toLocaleString()} คน ({malePercent}%)
        </span>
        <span className="flex items-center gap-1.5 font-medium text-rose-600">
          <span className="h-2 w-2 flex-none rounded-full bg-rose-400" />
          หญิง {female.toLocaleString()} คน ({femalePercent}%)
        </span>
      </div>
    </div>
  );
}

function ProvinceLeaderboard({ items }: { items: { name: string; count: number }[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={item.name} className="flex items-center gap-2.5">
          <span
            className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-bold ${
              i === 0
                ? "bg-amber-400 text-amber-950"
                : i === 1
                  ? "bg-slate-300 text-slate-900"
                  : i === 2
                    ? "bg-orange-300 text-orange-950"
                    : "bg-slate-100 text-slate-400"
            }`}
          >
            {i + 1}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{item.name}</span>
          <span className="flex-none text-sm font-bold text-emerald-600">{item.count.toLocaleString()} คน</span>
        </li>
      ))}
    </ul>
  );
}

function RankedBarList({ items }: { items: { label: string; count: number }[] }) {
  const max = Math.max(...items.map((i) => i.count));
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">{item.label}</span>
            <span className="font-bold text-slate-900">{item.count.toLocaleString()} คน</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const pillars = [
  {
    icon: Smile,
    title: "สนุกเป็นหลัก",
    description: "ปลูกฝังความรักในกีฬาฟุตบอลผ่านกิจกรรมที่สนุกและเหมาะสมกับวัย",
  },
  {
    icon: Users,
    title: "การมีส่วนร่วม",
    description: "เปิดโอกาสให้เด็กและเยาวชนทุกคนได้ร่วมกิจกรรมฟุตบอลอย่างทั่วถึง",
  },
  {
    icon: Heart,
    title: "พัฒนาการรอบด้าน",
    description: "เสริมสร้างทักษะกาย ใจ สังคม และการคิด ควบคู่ไปกับทักษะฟุตบอล",
  },
  {
    icon: Trophy,
    title: "รากฐานที่มั่นคง",
    description: "วางรากฐานสู่เส้นทางนักกีฬาและผู้ฝึกสอนในระดับที่สูงขึ้น",
  },
];

export default async function GrassrootsFootballPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm font-bold text-white">
                FA Thailand Technical
              </p>
              <p className="text-[11px] text-indigo-300">
                หมวด: Grassroots Football
              </p>
            </div>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าแรก
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-emerald-950 via-emerald-900 to-emerald-700">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-600 via-amber-400 to-amber-600" />
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -right-16 top-1/3 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Sprout className="h-7 w-7 text-amber-300" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Grassroots Football
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-emerald-100">
            ฟุตบอลรากหญ้า — จุดเริ่มต้นของการพัฒนานักกีฬาและผู้ฝึกสอนฟุตบอลไทย
            มุ่งส่งเสริมให้เด็กและเยาวชนได้เล่นฟุตบอลอย่างมีความสุขและถูกวิธี
          </p>
        </div>

        <svg
          className="relative block w-full text-slate-50"
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
        >
          <path fill="currentColor" d="M0,32 C480,72 960,0 1440,32 L1440,60 L0,60 Z" />
        </svg>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-20">
        <div className="-mt-4 mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500">{description}</p>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">สถิติโครงการฟุตบอลรากหญ้า ปี 2025</h2>
          <p className="mt-1 text-sm text-slate-500">สรุปข้อมูลผู้ฝึกสอนและนักฟุตบอลที่เข้าร่วมโครงการทั่วประเทศ</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ผู้ฝึกสอน */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2.5 bg-emerald-600 px-6 py-4">
              <UserCog className="h-5 w-5 text-white" />
              <h3 className="text-lg font-bold text-white">ผู้ฝึกสอน (โค้ช) 2025</h3>
            </div>
            <div className="space-y-6 p-6">
              <div>
                <p className="text-3xl font-extrabold text-slate-900">
                  {coachStats.total.toLocaleString()} <span className="text-base font-medium text-slate-400">คน</span>
                </p>
                <p className="text-sm text-slate-500">ผู้เข้าร่วมทั้งหมด</p>
                <div className="mt-3">
                  <GenderSplitBar
                    male={coachStats.male}
                    malePercent={coachStats.malePercent}
                    female={coachStats.female}
                    femalePercent={coachStats.femalePercent}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <MapPin className="h-8 w-8 flex-none text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{coachStats.provinces} จังหวัด</p>
                  <p className="text-xs text-slate-500">จังหวัดที่มีกิจกรรม</p>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold text-slate-700">5 อันดับจังหวัดที่มีผู้เข้าร่วมมากที่สุด</h4>
                <ProvinceLeaderboard items={coachStats.topProvinces} />
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold text-slate-700">ระดับใบอนุญาตผู้ฝึกสอน</h4>
                <RankedBarList items={coachStats.licenses} />
                <p className="mt-3 text-xs text-slate-400">
                  ยังไม่มีใบอนุญาตผู้ฝึกสอน {coachStats.noLicense.toLocaleString()} คน
                  (รวมระดับ A/B Diploma และอื่นๆ จำนวนเล็กน้อย)
                </p>
              </div>
            </div>
          </div>

          {/* นักฟุตบอล */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2.5 bg-emerald-600 px-6 py-4">
              <Users className="h-5 w-5 text-white" />
              <h3 className="text-lg font-bold text-white">นักฟุตบอล 2025</h3>
            </div>
            <div className="space-y-6 p-6">
              <div>
                <p className="text-3xl font-extrabold text-slate-900">
                  {playerStats.total.toLocaleString()} <span className="text-base font-medium text-slate-400">คน</span>
                </p>
                <p className="text-sm text-slate-500">ผู้เข้าร่วมทั้งหมด</p>
                <div className="mt-3">
                  <GenderSplitBar
                    male={playerStats.male}
                    malePercent={playerStats.malePercent}
                    female={playerStats.female}
                    femalePercent={playerStats.femalePercent}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <MapPin className="h-8 w-8 flex-none text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{playerStats.provinces} จังหวัด</p>
                  <p className="text-xs text-slate-500">จังหวัดที่มีกิจกรรม</p>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold text-slate-700">5 อันดับจังหวัดที่มีผู้เข้าร่วมมากที่สุด</h4>
                <ProvinceLeaderboard items={playerStats.topProvinces} />
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold text-slate-700">ช่วงอายุผู้เข้าร่วม</h4>
                <RankedBarList items={playerStats.ageRanges} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
