import { BrandLogo } from "@/components/BrandLogo";
import { LOCKED_MESSAGE } from "@/lib/login-guard";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { coachLogin } from "./actions";
import { coachCentreBg } from "@/lib/section-images";
import { display } from "@/components/fonts";
import { CoachCentreLogo } from "@/components/SectionLogos";
import { authInputClass } from "@/components/academy/AcademyShell";
import { LoginSubmit, PasswordInput } from "@/components/academy/AuthFields";
import { HomeButton } from "@/components/HomeButton";
import { AlertCircle, ArrowLeft, User, UserPlus } from "lucide-react";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "เข้าสู่ระบบผู้ฝึกสอน", description: "เข้าสู่ระบบศูนย์อบรมผู้ฝึกสอน ดูใบอนุญาต ประวัติการอบรม และสมัครหลักสูตร", path: "/coach-center/login" });

const POINTS = [
  { title: "ใบอนุญาตทุกระดับในที่เดียว", text: "ดูสถานะและวันหมดอายุ พร้อมบัตรผู้ฝึกสอนดิจิทัลที่ตรวจสอบได้ด้วย QR" },
  { title: "ดาวน์โหลดเอกสารได้เอง", text: "Diploma และ Licence ของทุกหลักสูตรที่ผ่านการอบรม" },
  { title: "สมัครอบรมและต่ออายุออนไลน์", text: "ติดตามสถานะใบสมัครและคำขอต่ออายุได้ทันที" },
];

export default async function CoachLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: "1" | "disabled" | "staff" | "locked" }>;
}) {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect(currentUser.role === "COACH" ? "/me" : "/");
  }

  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <aside className="relative isolate overflow-hidden bg-[#031a2c] text-white lg:sticky lg:top-0 lg:h-screen">
        <Image src={coachCentreBg} alt="" fill priority placeholder="blur" sizes="(min-width: 1024px) 55vw, 100vw" className="-z-10 object-cover opacity-35" />
        <div className="absolute inset-x-0 top-0 h-1 bg-[#e3bb63]" />
        <div className="flex h-full flex-col justify-between gap-10 px-6 py-6 sm:px-10 lg:py-10">
          <div className="flex items-center justify-between gap-3">
            <Link href="/coach-center" className="flex min-w-0 items-center gap-3">
              <BrandLogo tone="white" className="h-10" />
              <span className="h-7 w-px flex-none bg-white/25" />
              <CoachCentreLogo tone="white" className="hidden h-7 sm:block" />
              <span className="min-w-0 leading-tight">
                <span className={`${display.className} block truncate font-semibold`}>ศูนย์อบรมผู้ฝึกสอนฟุตบอล</span>
                <span className="block truncate text-[11px] text-white/60">Coach Education · FA Thailand</span>
              </span>
            </Link>
            {/* จอเล็ก: แผงซ้ายกลายเป็นแถบบน ปุ่มกลับหน้าแรกอยู่มุมขวาของแถบนี้ */}
            <div className="flex-none lg:hidden">
              <HomeButton tone="dark" />
            </div>
          </div>

          <div className="hidden max-w-lg lg:block">
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#e3bb63]">
              <span className="h-px w-10 bg-[#e3bb63]/70" />
              Coach Account
            </p>
            <h1 className={`${display.className} mt-5 text-5xl font-semibold leading-[1.08]`}>
              ใบอนุญาต ใบประกาศ
              <br />
              และการต่ออายุ
              <br />
              ในบัญชีเดียว
            </h1>
            <ol className="mt-10 space-y-5 border-t border-white/15 pt-6">
              {POINTS.map((p, i) => (
                <li key={p.title} className="flex gap-5">
                  <span className={`${display.className} w-8 flex-none text-xl font-semibold text-[#e3bb63]`}>{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block font-semibold">{p.title}</span>
                    <span className="block text-sm text-white/60">{p.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <p className="hidden text-xs text-white/45 lg:block">ฝ่ายเทคนิค สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์</p>
        </div>
      </aside>

      <main className="relative flex items-center justify-center px-5 py-10 sm:px-10 lg:py-16">
        <div className="absolute right-4 top-4 hidden lg:block">
          <HomeButton />
        </div>
        <div className="w-full max-w-sm">
          <Link href="/coach-center" className="inline-flex min-h-10 items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าศูนย์อบรมผู้ฝึกสอน
          </Link>
          <h2 className={`${display.className} mt-6 text-4xl font-semibold text-[#073c5e]`}>เข้าสู่ระบบ</h2>
          <p className="mt-2 text-sm text-slate-500">สำหรับผู้ฝึกสอนเท่านั้น</p>

          {error && (
            <p role="alert" className="mt-6 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
              <span>
                {error === "locked" ? (
                  LOCKED_MESSAGE
                ) : error === "disabled" ? (
                  "บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ"
                ) : error === "staff" ? (
                  <>
                    บัญชีนี้ไม่ใช่บัญชีผู้ฝึกสอน กรุณาเข้าสู่ระบบที่{" "}
                    <Link href="/login" className="font-medium underline">
                      หน้าเข้าสู่ระบบผู้ดูแลระบบ
                    </Link>
                  </>
                ) : (
                  "อีเมล/Username หรือรหัสผ่านไม่ถูกต้อง"
                )}
              </span>
            </p>
          )}

          <form action={coachLogin} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">อีเมล / Username</span>
              <span className="relative mt-1.5 block">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                <input name="email" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} required autoFocus className={authInputClass} />
              </span>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">รหัสผ่าน</span>
              <span className="mt-1.5 block">
                <PasswordInput name="password" autoComplete="current-password" />
              </span>
            </label>
            <LoginSubmit tone="bg-[#031a2c] hover:bg-[#073c5e]" />
          </form>

          <div className="mt-10 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            ยังไม่มีบัญชี?
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <Link
            href="/register"
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 transition hover:border-[#073c5e] hover:text-[#073c5e]"
          >
            <UserPlus className="h-4 w-4" />
            สมัครสมาชิกผู้ฝึกสอน
          </Link>
        </div>
      </main>
    </div>
  );
}
