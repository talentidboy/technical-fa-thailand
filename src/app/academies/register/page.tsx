import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getAcademyUser } from "@/lib/auth";
import thailandMap from "@/lib/thailand-map.json";
import { AuthShell } from "@/components/academy/AuthShell";
import { RegisterForm } from "@/components/academy/RegisterForm";
import { academyFont } from "@/components/typefaces/academy";
import { ArrowLeft, ClipboardCheck, FileUp, ShieldCheck, Users } from "lucide-react";

export const metadata: Metadata = { title: "สมัครบัญชีอคาเดมี | Academy Licensing" };

const STEPS = [
  { icon: Users, title: "1. สมัครบัญชีและกรอกข้อมูล", desc: "ข้อมูลอคาเดมี บุคลากร ทีมและรายชื่อนักเตะ" },
  { icon: FileUp, title: "2. ยื่นใบสมัครพร้อมหลักฐาน", desc: "แนบเอกสารตามเกณฑ์ของระดับที่ขอ ทีละข้อ" },
  { icon: ClipboardCheck, title: "3. สมาคมฯ ตรวจและแจ้งผล", desc: "ติดตามผลการตรวจรายข้อได้ในพอร์ทัล" },
  { icon: ShieldCheck, title: "4. ได้รับใบอนุญาต", desc: "ขึ้นแผนที่และทำเนียบอคาเดมีที่ได้รับการรับรอง" },
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
    <AuthShell eyebrow="Academy Licensing" title="ยื่นขอใบอนุญาตออนไลน์" intro="ขอใบอนุญาตรับรองมาตรฐานอคาเดมี FAT Bronze / Silver / Gold ได้ครบในระบบเดียว" points={STEPS} wide>
      <div className="flex items-center justify-between gap-3 text-sm">
        <Link href="/academies" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" />
          ทำเนียบอคาเดมี
        </Link>
        <span className="text-slate-500">
          มีบัญชีแล้ว?{" "}
          <Link href="/academies/login" className="font-semibold text-indigo-600 hover:text-indigo-800">
            เข้าสู่ระบบ
          </Link>
        </span>
      </div>
      <h2 className={`${academyFont.className} mt-6 text-4xl font-bold text-[#0b1f44]`}>สมัครบัญชีอคาเดมี</h2>
      <p className="mt-2 text-sm text-slate-500">อคาเดมีใหม่เริ่มใช้งานได้ทันที · อคาเดมีที่มีในทะเบียนแล้ว รอสมาคมฯ ยืนยันสิทธิ์ดูแล</p>
      <div className="mt-8">
        <RegisterForm academies={academies} provinces={provinces} />
      </div>
    </AuthShell>
  );
}
