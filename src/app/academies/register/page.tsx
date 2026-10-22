import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getAcademyUser } from "@/lib/auth";
import thailandMap from "@/lib/thailand-map.json";
import { AcademyTopBar } from "@/components/academy/AcademyShell";
import { RegisterForm } from "@/components/academy/RegisterForm";
import { ArrowLeft, ClipboardCheck, FileUp, ShieldCheck, Users } from "lucide-react";

export const metadata: Metadata = { title: "สมัครบัญชีอคาเดมี | Academy Licensing" };

const STEPS = [
  { icon: Users, title: "สมัครบัญชีและกรอกข้อมูล", desc: "ข้อมูลอคาเดมี บุคลากร ทีมและรายชื่อนักเตะ" },
  { icon: FileUp, title: "ยื่นใบสมัครพร้อมหลักฐาน", desc: "แนบเอกสารตามเกณฑ์ของระดับที่ขอ ทีละข้อ" },
  { icon: ClipboardCheck, title: "สมาคมฯ ตรวจและแจ้งผล", desc: "ติดตามผลการตรวจรายข้อได้ในพอร์ทัล" },
  { icon: ShieldCheck, title: "ได้รับใบอนุญาต", desc: "แสดงบนทำเนียบอคาเดมีที่ได้รับการรับรอง" },
];

export default async function AcademyRegisterPage() {
  if (await getAcademyUser()) redirect("/academies/portal");
  const academies = await prisma.academy.findMany({
    where: { active: true },
    select: { id: true, nameEn: true, nameTh: true, province: true },
    orderBy: { nameEn: "asc" },
  });
  const provinces = thailandMap.provinces.map((p) => p.th).sort((a, b) => a.localeCompare(b, "th"));

  return (
    <div className="min-h-screen bg-slate-50">
      <AcademyTopBar subtitle="สมัครบัญชีอคาเดมี">
        <Link href="/academies/login" className="rounded-lg border border-white/15 px-3 py-2 text-sm text-indigo-200 hover:bg-white/10">
          เข้าสู่ระบบ
        </Link>
      </AcademyTopBar>
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
        <section>
          <Link href="/academies" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" />
            ทำเนียบอคาเดมี
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold text-slate-900">สมัครบัญชีอคาเดมี</h1>
          <p className="mt-2 text-slate-600">ขอใบอนุญาตรับรองมาตรฐานอคาเดมี FAT Bronze / Silver / Gold ผ่านระบบออนไลน์</p>
          <ol className="mt-6 space-y-3">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <li key={title} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    {i + 1}. {title}
                  </span>
                  <span className="block text-xs text-slate-500">{desc}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <RegisterForm academies={academies} provinces={provinces} />
        </section>
      </main>
    </div>
  );
}
