import Link from "next/link";
import { Compass, Home, GraduationCap, Trophy } from "lucide-react";

export const metadata = { title: "ไม่พบหน้านี้ — FA Thailand Technical" };

// หน้า 404 ภาษาไทย (ลิงก์ผิด / หน้าถูกลบ / ข้อมูลไม่มีแล้ว)
export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-md text-center">
        <p className="text-7xl font-black tracking-tight text-slate-200">404</p>
        <span className="mx-auto -mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
          <Compass className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-xl font-bold text-slate-900">ไม่พบหน้าที่คุณต้องการ</h1>
        <p className="mt-2 text-sm text-slate-500">ลิงก์อาจไม่ถูกต้อง หรือข้อมูลนี้ถูกลบไปแล้ว</p>
        <div className="mt-7 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { href: "/", label: "หน้าแรก", icon: Home },
            { href: "/coach-center", label: "ศูนย์อบรมผู้ฝึกสอน", icon: GraduationCap },
            { href: "/g15-womens-series", label: "G15 Series", icon: Trophy },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <Icon className="h-4 w-4 text-indigo-600" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
