import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LOGO_URL } from "@/lib/brand";
import { ArrowLeft, Trophy, Venus, Calendar, Users } from "lucide-react";

const highlights = [
  {
    icon: Venus,
    title: "ฟุตบอลหญิง",
    description: "เวทีการแข่งขันสำหรับนักฟุตบอลหญิงเยาวชน",
  },
  {
    icon: Users,
    title: "รุ่นอายุไม่เกิน 15 ปี",
    description: "เปิดโอกาสให้นักฟุตบอลหญิงรุ่นเยาว์ได้แสดงศักยภาพ",
  },
  {
    icon: Calendar,
    title: "ซีรีส์ปี 2026",
    description: "ส่วนหนึ่งของแผนพัฒนาฟุตบอลหญิงระยะยาวของสมาคมฯ",
  },
];

export default async function G15WomensSeriesPage() {
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
                หมวด: G15 Women&apos;s Football Series
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
      <section className="relative overflow-hidden bg-linear-to-br from-rose-950 via-rose-900 to-fuchsia-800">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-600 via-amber-400 to-amber-600" />
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-rose-400/20 blur-3xl" />
        <div className="absolute -right-16 top-1/3 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Trophy className="h-7 w-7 text-amber-300" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            G15 Women&apos;s Football Series 2026
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-rose-100">
            เวทีการแข่งขันฟุตบอลหญิงรุ่นอายุไม่เกิน 15 ปี
            เพื่อส่งเสริมและพัฒนานักฟุตบอลหญิงเยาวชนของไทยสู่เส้นทางความเป็นเลิศ
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
        <div className="-mt-4 mb-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {highlights.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500">{description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Trophy className="h-8 w-8 text-slate-300" />
          <p className="font-medium text-slate-500">
            กำหนดการและรายละเอียดการแข่งขัน
          </p>
          <p className="text-sm text-slate-400">
            อยู่ระหว่างการพัฒนา เร็วๆ นี้จะมีตารางแข่งขันและข้อมูลเพิ่มเติม
          </p>
        </div>
      </div>
    </div>
  );
}
