import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LOGO_URL, COVER_URL } from "@/lib/brand";
import { ArrowLeft, LogIn, UserPlus, GraduationCap, ArrowRight } from "lucide-react";

// หน้าทางเข้าสาธารณะเฉพาะผู้ฝึกสอน — จุดแรกที่การ์ด "ศูนย์อบรมผู้ฝึกสอนฟุตบอล" ในหน้าแรกพาคนที่ยังไม่ล็อกอินมาที่นี่
// (แอดมิน/เจ้าหน้าที่ยังใช้ /login ตรงๆ ตามเดิม ไม่ผ่านหน้านี้)
export default async function CoachCenterPage() {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect(currentUser.role === "COACH" ? "/me" : "/");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0">
        <Image
          src={COVER_URL}
          alt="สำนักงานสมาคมกีฬาฟุตบอลแห่งประเทศไทย"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-br from-indigo-950/90 via-indigo-900/85 to-indigo-700/90" />
      </div>
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-600 via-amber-400 to-amber-600" />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="h-1.5 bg-linear-to-r from-amber-500 via-amber-300 to-amber-500" />
        <div className="p-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            กลับหน้าแรก
          </Link>

          <div className="mt-4 flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 ring-4 ring-amber-400/30">
              <GraduationCap className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="mt-2 text-lg font-bold text-slate-900">ศูนย์อบรมผู้ฝึกสอนฟุตบอล</h2>
            <p className="text-sm text-slate-500">ระบบสำหรับผู้ฝึกสอนฟุตบอล — ใบอนุญาต AFC และคอร์สอบรม</p>
          </div>

          <div className="mt-6 space-y-3">
            <Link
              href="/login"
              className="group flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <LogIn className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">มีบัญชีอยู่แล้ว</p>
                <p className="text-xs text-slate-500">เข้าสู่ระบบด้วยอีเมลและรหัสผ่านของคุณ</p>
              </div>
              <ArrowRight className="h-4 w-4 flex-none text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
            </Link>

            <Link
              href="/register"
              className="group flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-amber-300 hover:bg-amber-50/50"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <UserPlus className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">ยังไม่มีบัญชี</p>
                <p className="text-xs text-slate-500">สมัครสมาชิกผู้ฝึกสอนใหม่ ใช้เวลาไม่กี่นาที</p>
              </div>
              <ArrowRight className="h-4 w-4 flex-none text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-500" />
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-100 pt-5">
            <Image src={LOGO_URL} alt="FA Thailand" width={20} height={20} className="h-5 w-5 rounded object-cover" />
            <p className="text-xs text-slate-400">FA Thailand Technical</p>
          </div>
        </div>
      </div>
    </div>
  );
}
