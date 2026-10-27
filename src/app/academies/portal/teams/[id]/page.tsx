import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { parseId } from "@/lib/route-id";
import { requireAcademy } from "@/lib/academy-portal";
import { POSITIONS, minPlayers, teamCheck } from "@/lib/academy-checks";
import { thaiDate } from "@/lib/academy";
import { ResultForm } from "@/components/ResultForm";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { GENDERS, PlayerFields, TeamFields } from "@/components/academy/TeamFields";
import { addPlayer, deletePlayer, deleteTeam, givePlayerConsent, updatePlayer, updateTeam } from "../../actions";
import { Card, btn } from "@/components/academy/ManageUi";
import { Progress } from "@/components/academy/PortalUi";
import { academyPoster } from "@/components/typefaces/academy";
import { ArrowLeft, CheckCircle2, Pencil, Plus, Save, ShieldCheck, Trash2, TriangleAlert, UserPlus, Users } from "lucide-react";

export const metadata: Metadata = { title: "รายชื่อนักเตะ | พอร์ทัลอคาเดมี" };

export default async function PortalTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { member } = await requireAcademy();
  const id = parseId((await params).id);
  if (!id) notFound();
  const team = await prisma.academyTeam.findFirst({
    where: { id, academyId: member.academyId },
    include: { players: { orderBy: [{ position: "asc" }, { shirtNo: "asc" }, { id: "asc" }] } },
  });
  if (!team) notFound();
  const consented = !!member.academy.playerConsentAt;
  const check = teamCheck(team);
  const gk = team.players.filter((p) => p.position === "GK").length;

  return (
    <div className="space-y-6">
      <Link href="/academies/portal/teams" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0b6cb0] hover:underline">
        <ArrowLeft className="h-4 w-4" />
        ทีมทั้งหมด
      </Link>
      <section className="relative isolate flex flex-wrap items-center gap-4 overflow-hidden rounded-3xl bg-[#1e96dc] p-6 text-[#0b1220]">
        <span aria-hidden className="absolute -right-12 -top-16 -z-10 h-48 w-48 rounded-full bg-white/15" />
        <div className="min-w-[12rem] flex-1">
          <h1 className={`${academyPoster.className} text-3xl font-extrabold`}>{team.name}</h1>
          <p className="text-sm font-medium text-[#0b1220]/75">
            U{team.ageGroup} · {GENDERS[team.gender] ?? team.gender}
          </p>
          <Progress value={team.players.length} max={minPlayers(team.ageGroup)} className="mt-3 max-w-xs bg-white/40" />
        </div>
        <p className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold ${check.ok ? "bg-white text-emerald-700" : "bg-[#ffd426] text-[#0b1220]"}`}>
          {check.ok ? <CheckCircle2 className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}
          นักเตะ {team.players.length}/{minPlayers(team.ageGroup)} · ผู้รักษาประตู {gk}/2
        </p>
      </section>

      {!consented ? (
        <section className="rounded-2xl border border-l-4 border-amber-200 border-l-amber-500 bg-amber-50 p-6">
          <h2 className="flex items-center gap-2 font-semibold text-amber-900">
            <ShieldCheck className="h-5 w-5" />
            ยืนยันความยินยอมก่อนกรอกข้อมูลนักเตะ
          </h2>
          <p className="mt-2 text-sm text-amber-900/80">
            ข้อมูลนักเตะเป็นข้อมูลส่วนบุคคลของผู้เยาว์ ใช้เพื่อการพิจารณาใบอนุญาตอคาเดมีเท่านั้น เห็นเฉพาะอคาเดมีและสมาคมฯ และไม่แสดงต่อสาธารณะ
          </p>
          <ResultForm action={givePlayerConsent} className="mt-4">
            <label className="flex items-start gap-2 text-sm text-amber-950">
              <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 rounded border-amber-300" />
              อคาเดมีได้รับความยินยอมจากผู้ปกครองของนักเตะ ให้ส่งชื่อ-สกุล ชื่อเล่น วันเกิด ตำแหน่ง และเบอร์เสื้อ ให้สมาคมฯ เพื่อการพิจารณาใบอนุญาตอคาเดมี
            </label>
            <button type="submit" className="mt-4 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600">
              ยืนยัน
            </button>
          </ResultForm>
        </section>
      ) : (
        <>
          <Card title={`รายชื่อนักเตะ (${team.players.length} คน)`} icon={Users} tone="emerald" flush>
            {team.players.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-slate-400">ยังไม่มีนักเตะในทีมนี้</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {team.players.map((p) => (
                  <li key={p.id}>
                    <div className="flex items-center gap-3 px-5 py-3">
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#0b1220] text-sm font-bold text-[#ffd426]">{p.shirtNo ?? "–"}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">
                          {p.firstName} {p.lastName}
                          {p.nickname && <span className="font-normal text-slate-500"> ({p.nickname})</span>}
                        </p>
                        <p className="text-xs text-slate-500">
                          {POSITIONS[p.position] ?? p.position}
                          {p.birthDate && ` · เกิด ${thaiDate(p.birthDate)}`}
                        </p>
                      </div>
                      {p.position === "GK" && <span className="rounded-md bg-[#ffd426] px-2 py-0.5 text-xs font-bold text-[#0b1220]">GK</span>}
                      <ResultForm action={deletePlayer} quiet>
                        <input type="hidden" name="id" value={p.id} />
                        <ConfirmSubmit message={`ลบ ${p.firstName} ${p.lastName} ใช่ไหม?`} ariaLabel={`ลบ ${p.firstName}`} className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </ConfirmSubmit>
                      </ResultForm>
                    </div>
                    <details className="border-t border-slate-100">
                      <summary className="flex cursor-pointer items-center gap-1.5 px-5 py-2 text-xs font-bold text-[#0b6cb0] hover:bg-[#f4f8fc]">
                        <Pencil className="h-3.5 w-3.5" />
                        แก้ไข
                      </summary>
                      <ResultForm action={updatePlayer} className="border-t border-slate-100 p-5">
                        <input type="hidden" name="id" value={p.id} />
                        <PlayerFields player={p} />
                        <button type="submit" className={`${btn.primary} mt-4`}>
                          <Save className="h-4 w-4" />
                          บันทึก
                        </button>
                      </ResultForm>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="เพิ่มนักเตะ" icon={UserPlus} tone="sky">
            <ResultForm action={addPlayer} resetOnSuccess successText="เพิ่มนักเตะแล้ว — กรอกคนถัดไปได้เลย">
              <input type="hidden" name="teamId" value={team.id} />
              <PlayerFields />
              <button type="submit" className={`${btn.primary} mt-4`}>
                <Plus className="h-4 w-4" />
                เพิ่มนักเตะ
              </button>
            </ResultForm>
          </Card>
        </>
      )}

      <details className="rounded-2xl border border-slate-200 bg-white">
        <summary className="cursor-pointer px-6 py-4 text-sm font-semibold text-slate-700">แก้ไขทีม / ลบทีม</summary>
        <div className="space-y-4 border-t border-slate-100 p-6">
          <ResultForm action={updateTeam}>
            <input type="hidden" name="id" value={team.id} />
            <TeamFields team={team} />
            <button type="submit" className={`${btn.primary} mt-4`}>
              <Save className="h-4 w-4" />
              บันทึกทีม
            </button>
          </ResultForm>
          <ResultForm action={deleteTeam} quiet>
            <input type="hidden" name="id" value={team.id} />
            <ConfirmSubmit
              message={`ลบทีม ${team.name} และรายชื่อนักเตะทั้งหมด ${team.players.length} คนใช่ไหม?`}
              className={btn.danger}
            >
              <Trash2 className="h-4 w-4" />
              ลบทีม
            </ConfirmSubmit>
          </ResultForm>
        </div>
      </details>
    </div>
  );
}
