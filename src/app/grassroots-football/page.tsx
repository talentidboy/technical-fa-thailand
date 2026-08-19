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
} from "lucide-react";

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

        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Sprout className="h-8 w-8 text-slate-300" />
          <p className="font-medium text-slate-500">
            รายละเอียดโครงการและกิจกรรมฟุตบอลรากหญ้า
          </p>
          <p className="text-sm text-slate-400">
            อยู่ระหว่างการพัฒนา เร็วๆ นี้จะมีข้อมูลโครงการและกิจกรรมเพิ่มเติม
          </p>
        </div>
      </div>
    </div>
  );
}
