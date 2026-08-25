import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  updateTeam,
  createPlayer,
  updatePlayer,
  deletePlayer,
  createOfficial,
  updateOfficial,
  deleteOfficial,
} from "../../actions";
import { Field } from "@/components/FormField";
import { LogoPasteField } from "@/components/g15/LogoPasteField";
import { LOGO_URL } from "@/lib/brand";
import { ArrowLeft, Shield, Users, UserCog, Trash2, ChevronDown } from "lucide-react";

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default async function G15ManageTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.role !== "ADMIN" && currentUser.role !== "STAFF") {
    redirect("/g15-womens-series");
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const team = await prisma.g15Team.findUnique({ where: { id } });
  if (!team) notFound();

  const [players, officials] = await Promise.all([
    prisma.g15Player.findMany({ where: { teamId: id }, orderBy: { no: "asc" } }),
    prisma.g15Official.findMany({ where: { teamId: id }, orderBy: { no: "asc" } }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
          <Link href="/g15-womens-series/manage" className="flex min-w-0 items-center gap-2">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={36}
              height={36}
              className="h-9 w-9 flex-none rounded-lg object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">FA Thailand Technical</p>
              <p className="truncate text-[11px] text-indigo-300">จัดการข้อมูลทีม G15</p>
            </div>
          </Link>
          <Link
            href="/g15-womens-series/manage"
            className="inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 px-2.5 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white sm:px-3"
          >
            <ArrowLeft className="h-4 w-4 flex-none" />
            <span className="hidden sm:inline">กลับหน้าจัดการข้อมูล</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{team.name}</h1>
          <p className="mt-1 text-sm text-slate-500">แก้ไขข้อมูลทีม รายชื่อนักกีฬา และเจ้าหน้าที่</p>
        </div>

        {/* ข้อมูลทีม */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <Shield className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">ข้อมูลทีม</h2>
          </div>
          <form action={updateTeam} className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            <input type="hidden" name="id" value={team.id} />
            <Field label="ชื่อทีม" name="name" required defaultValue={team.name} />
            <Field label="กลุ่ม" name="groupName" placeholder="ภาคใต้ - กลุ่ม A" defaultValue={team.groupName ?? ""} />
            <LogoPasteField label="โลโก้ทีม (อัปโหลดใหม่เพื่อแทนที่)" currentUrl={team.logoUrl} />
            <div className="sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-rose-200 transition-colors hover:bg-rose-700"
              >
                บันทึกข้อมูลทีม
              </button>
            </div>
          </form>
        </div>

        {/* นักกีฬา */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">นักกีฬา ({players.length})</h2>
          </div>

          <details className="border-b border-slate-100 px-6 py-4">
            <summary className="cursor-pointer text-sm font-medium text-rose-600">+ เพิ่มนักกีฬาใหม่</summary>
            <form action={createPlayer} className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <input type="hidden" name="teamId" value={team.id} />
              <Field label="เบอร์ทะเบียน" name="no" type="number" />
              <Field label="ชื่อ (ไทย)" name="firstNameTh" required />
              <Field label="นามสกุล (ไทย)" name="lastNameTh" required />
              <Field label="ชื่อ (English)" name="firstNameEn" />
              <Field label="นามสกุล (English)" name="lastNameEn" />
              <Field label="สัญชาติ" name="nationality" />
              <Field label="ชื่อบนเสื้อ" name="jerseyName" />
              <Field label="เบอร์เสื้อ" name="jerseyNumber" type="number" />
              <Field label="ตำแหน่ง" name="position" placeholder="กองหน้า" />
              <Field label="วันเกิด" name="dob" type="date" />
              <Field label="น้ำหนัก (กก.)" name="weightKg" type="number" />
              <Field label="ส่วนสูง (ซม.)" name="heightCm" type="number" />
              <div className="col-span-full">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
                >
                  เพิ่มนักกีฬา
                </button>
              </div>
            </form>
          </details>

          {players.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">ยังไม่มีนักกีฬาในทีมนี้</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {players.map((p) => (
                <li key={p.id}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-6 py-3 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                      <ChevronDown className="h-3.5 w-3.5 flex-none text-slate-400 transition-transform group-open:rotate-180" />
                      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-rose-50 text-xs font-bold text-rose-600">
                        {p.jerseyNumber ?? p.no ?? "-"}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                        {p.firstNameTh} {p.lastNameTh}
                      </span>
                      <span className="hidden flex-none text-xs text-slate-500 sm:block">{p.position ?? "-"}</span>
                      <span className="hidden flex-none text-xs text-slate-400 md:block">{p.nationality ?? "-"}</span>
                    </summary>

                    <div className="border-t border-slate-100 px-6 py-4">
                      <form
                        id={`player-form-${p.id}`}
                        action={updatePlayer}
                        className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6"
                      >
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="teamId" value={team.id} />
                        <Field label="เบอร์ทะเบียน" name="no" type="number" defaultValue={p.no?.toString() ?? ""} />
                        <Field label="ชื่อ (ไทย)" name="firstNameTh" required defaultValue={p.firstNameTh} />
                        <Field label="นามสกุล (ไทย)" name="lastNameTh" required defaultValue={p.lastNameTh} />
                        <Field label="ชื่อ (English)" name="firstNameEn" defaultValue={p.firstNameEn ?? ""} />
                        <Field label="นามสกุล (English)" name="lastNameEn" defaultValue={p.lastNameEn ?? ""} />
                        <Field label="สัญชาติ" name="nationality" defaultValue={p.nationality ?? ""} />
                        <Field label="ชื่อบนเสื้อ" name="jerseyName" defaultValue={p.jerseyName ?? ""} />
                        <Field
                          label="เบอร์เสื้อ"
                          name="jerseyNumber"
                          type="number"
                          defaultValue={p.jerseyNumber?.toString() ?? ""}
                        />
                        <Field label="ตำแหน่ง" name="position" defaultValue={p.position ?? ""} />
                        <Field label="วันเกิด" name="dob" type="date" defaultValue={toDateInputValue(p.dob)} />
                        <Field
                          label="น้ำหนัก (กก.)"
                          name="weightKg"
                          type="number"
                          defaultValue={p.weightKg?.toString() ?? ""}
                        />
                        <Field
                          label="ส่วนสูง (ซม.)"
                          name="heightCm"
                          type="number"
                          defaultValue={p.heightCm?.toString() ?? ""}
                        />
                      </form>
                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        <form action={deletePlayer}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="teamId" value={team.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            ลบนักกีฬาคนนี้
                          </button>
                        </form>
                        <button
                          type="submit"
                          form={`player-form-${p.id}`}
                          className="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                        >
                          บันทึก
                        </button>
                      </div>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* เจ้าหน้าที่ */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <UserCog className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">เจ้าหน้าที่ ({officials.length})</h2>
          </div>

          <details className="border-b border-slate-100 px-6 py-4">
            <summary className="cursor-pointer text-sm font-medium text-rose-600">+ เพิ่มเจ้าหน้าที่ใหม่</summary>
            <form action={createOfficial} className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              <input type="hidden" name="teamId" value={team.id} />
              <Field label="เบอร์ทะเบียน" name="no" type="number" />
              <Field label="ชื่อ (ไทย)" name="firstNameTh" required />
              <Field label="นามสกุล (ไทย)" name="lastNameTh" required />
              <Field label="ชื่อ (English)" name="firstNameEn" />
              <Field label="นามสกุล (English)" name="lastNameEn" />
              <Field label="เพศ" name="gender" />
              <Field label="สัญชาติ" name="nationality" />
              <Field label="บทบาท" name="role" placeholder="หัวหน้าผู้ฝึกสอน" />
              <Field label="วันเกิด" name="dob" type="date" />
              <Field label="ใบอนุญาตผู้ฝึกสอน" name="coachingLicense" />
              <div className="col-span-full">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-600"
                >
                  เพิ่มเจ้าหน้าที่
                </button>
              </div>
            </form>
          </details>

          {officials.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">ยังไม่มีเจ้าหน้าที่ในทีมนี้</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {officials.map((o) => (
                <li key={o.id}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-6 py-3 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                      <ChevronDown className="h-3.5 w-3.5 flex-none text-slate-400 transition-transform group-open:rotate-180" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                        {o.firstNameTh} {o.lastNameTh}
                      </span>
                      <span className="hidden flex-none text-xs text-slate-500 sm:block">{o.role ?? "-"}</span>
                      <span className="hidden flex-none text-xs text-slate-400 md:block">{o.gender ?? "-"}</span>
                    </summary>

                    <div className="border-t border-slate-100 px-6 py-4">
                      <form
                        id={`official-form-${o.id}`}
                        action={updateOfficial}
                        className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5"
                      >
                        <input type="hidden" name="id" value={o.id} />
                        <input type="hidden" name="teamId" value={team.id} />
                        <Field label="เบอร์ทะเบียน" name="no" type="number" defaultValue={o.no?.toString() ?? ""} />
                        <Field label="ชื่อ (ไทย)" name="firstNameTh" required defaultValue={o.firstNameTh} />
                        <Field label="นามสกุล (ไทย)" name="lastNameTh" required defaultValue={o.lastNameTh} />
                        <Field label="ชื่อ (English)" name="firstNameEn" defaultValue={o.firstNameEn ?? ""} />
                        <Field label="นามสกุล (English)" name="lastNameEn" defaultValue={o.lastNameEn ?? ""} />
                        <Field label="เพศ" name="gender" defaultValue={o.gender ?? ""} />
                        <Field label="สัญชาติ" name="nationality" defaultValue={o.nationality ?? ""} />
                        <Field label="บทบาท" name="role" defaultValue={o.role ?? ""} />
                        <Field label="วันเกิด" name="dob" type="date" defaultValue={toDateInputValue(o.dob)} />
                        <Field label="ใบอนุญาตผู้ฝึกสอน" name="coachingLicense" defaultValue={o.coachingLicense ?? ""} />
                      </form>
                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        <form action={deleteOfficial}>
                          <input type="hidden" name="id" value={o.id} />
                          <input type="hidden" name="teamId" value={team.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            ลบเจ้าหน้าที่คนนี้
                          </button>
                        </form>
                        <button
                          type="submit"
                          form={`official-form-${o.id}`}
                          className="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                        >
                          บันทึก
                        </button>
                      </div>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
