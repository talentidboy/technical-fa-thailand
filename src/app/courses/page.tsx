import Link from "next/link";
import Image from "next/image";
import { CoursesSection } from "@/components/CoursesSection";
import { LOGO_URL } from "@/lib/brand";
import { ArrowLeft, GraduationCap } from "lucide-react";

export default function CoursesPage() {
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
                หมวด: ศูนย์อบรมผู้ฝึกสอนฟุตบอล
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
      <section className="relative overflow-hidden bg-linear-to-br from-indigo-950 via-indigo-900 to-indigo-700">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-600 via-amber-400 to-amber-600" />
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-indigo-400/30 blur-3xl" />
        <div className="absolute -right-16 top-1/3 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <GraduationCap className="h-7 w-7 text-amber-300" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            หลักสูตรอบรมผู้ฝึกสอน
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-indigo-200">
            เส้นทางการพัฒนาผู้ฝึกสอนตามมาตรฐานสมาพันธ์ฟุตบอลเอเชีย (AFC)
          </p>

          <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-amber-400/20 pt-6">
            <div>
              <p className="text-2xl font-bold text-amber-400">3</p>
              <p className="text-xs text-indigo-300">สายหลักสูตร</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">5</p>
              <p className="text-xs text-indigo-300">ระดับใน Core Program</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">AFC</p>
              <p className="text-xs text-indigo-300">มาตรฐานรับรอง</p>
            </div>
          </div>
        </div>

        <svg
          className="relative block w-full text-slate-50"
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
        >
          <path fill="currentColor" d="M0,32 C480,72 960,0 1440,32 L1440,60 L0,60 Z" />
        </svg>
      </section>

      <CoursesSection />
    </div>
  );
}
