import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAcademy, APPLICATION_KINDS, APPLICATION_STATUS, OPEN_STATUSES } from "@/lib/academy-portal";
import { ACADEMY_LEVELS, LEVEL_META, STATE_META, currentLicence, daysUntil, isLevel, licenceState, showPublicly, thaiDate, tierLabel } from "@/lib/academy";
import { autoChecks, teamCheck } from "@/lib/academy-checks";
import { loadCheckData } from "@/lib/academy-data";
import { Card, TONES, type Tone } from "@/components/academy/ManageUi";
import { Coin, LEVEL_TEXT } from "@/components/academy/PortalUi";
import { academyPoster } from "@/components/typefaces/academy";
import { ArrowRight, Bell, Check, CheckCircle2, Clock, ExternalLink, FileCheck2, Gauge, ListChecks, Shirt, Trophy, Users, XCircle, type LucideIcon } from "lucide-react";

export const metadata: Metadata = { title: "พอร์ทัลอคาเดมี | Academy Licensing" };

const AUTO_LABELS: Record<string, string> = {
  "1.1.3": "หัวหน้าอคาเดมี",
  "1.3.1": "ผู้ฝึกสอน",
  "1.6.1": "จำนวนทีม / นักกีฬา",
  "1.6.2": "นักเตะต่อทีม",
};

const P = academyPoster.className;

export default async function AcademyPortalHome() {
  const { member } = await requireAcademy({ approved: false });

  if (member.status !== "APPROVED") {
    const pending = member.status === "PENDING";
    return (
      <section className={`mx-auto max-w-2xl overflow-hidden rounded-3xl border-t-4 bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 ${pending ? "border-t-[#1e96dc]" : "border-t-red-500"}`}>
        <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${pending ? "bg-[#ffd426] text-[#0b1220]" : "bg-red-50 text-red-500"}`}>
          {pending ? <Clock className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
        </span>
        <h1 className={`${P} mt-4 text-2xl font-bold text-[#0b1220]`}>{pending ? "รอสมาคมฯ อนุมัติสิทธิ์ดูแลอคาเดมี" : "คำขอสิทธิ์ดูแลอคาเดมีไม่ได้รับอนุมัติ"}</h1>
        <p className="mt-2 font-semibold text-slate-700">
          {member.academy.nameEn}
          {member.academy.province && <span className="font-normal text-slate-500"> · {member.academy.province}</span>}
        </p>
        {pending ? (
          <ol className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm">
            {["ส่งคำขอสิทธิ์ดูแลแล้ว", "สมาคมฯ ตรวจสอบว่าเป็นผู้ดูแลอคาเดมีจริง", "ได้รับอนุมัติ → จัดการข้อมูลและยื่นใบสมัครได้ทันที"].map((t, i) => (
              <li key={t} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${i === 1 ? "bg-[#e6f3fc] font-semibold text-[#0b1220]" : "text-slate-600"}`}>
                <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-emerald-500 text-white" : i === 1 ? "bg-[#1e96dc] text-white" : "bg-slate-100 text-slate-500"}`}>
                  {i === 0 ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                {t}
              </li>
            ))}
          </ol>
        ) : (
          member.note && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">เหตุผล: {member.note}</p>
        )}
        {pending && <p className="mt-5 text-xs text-slate-500">ระหว่างนี้ติดต่อสอบถามฝ่ายเทคนิคของสมาคมฯ ได้</p>}
      </section>
    );
  }

  const now = new Date();
  const [academy, check, notices] = await Promise.all([
    prisma.academy.findUniqueOrThrow({
      where: { id: member.academyId },
      include: {
        licences: true,
        applications: { orderBy: { createdAt: "desc" }, take: 5, include: { evidence: { select: { status: true } } } },
        _count: { select: { staff: true, teams: true, applications: true } },
      },
    }),
    loadCheckData(member.academyId),
    prisma.academyNotice.findMany({ where: { academyId: member.academyId }, orderBy: { createdAt: "desc" }, take: 4 }),
  ]);
  const current = currentLicence(academy.licences);
  const state = licenceState(current, now);
  const level = current && isLevel(current.level) ? current.level : null;
  const openApp = academy.applications.find((a) => OPEN_STATUSES.includes(a.status));
  const players = check.teams.reduce((n, t) => n + t.players.length, 0);
  const keepers = check.teams.reduce((n, t) => n + t.players.filter((p) => p.position === "GK").length, 0);
  const teamsOk = check.teams.filter((t) => teamCheck(t).ok).length;
  const hasHead = check.staff.some((s) => s.role === "HEAD");
  const daysLeft = current?.expiresAt ? daysUntil(current.expiresAt, now) : null;
  const span = current?.approvedAt && current.expiresAt ? current.expiresAt.getTime() - current.approvedAt.getTime() : 0;
  const used = span ? Math.min(100, Math.max(0, ((now.getTime() - current!.approvedAt!.getTime()) / span) * 100)) : 0;

  const steps = [
    { done: !!(academy.province && academy.address && (academy.phone || academy.email)), label: "กรอกข้อมูลอคาเดมี", hint: "จังหวัด ที่อยู่ ช่องทางติดต่อ", href: "/academies/portal/profile" },
    { done: hasHead, label: "เพิ่มบุคลากร", hint: hasHead ? `มีหัวหน้าอคาเดมีแล้ว · ${academy._count.staff} คน` : "ต้องมีหัวหน้าอคาเดมีอย่างน้อย 1 คน", href: "/academies/portal/staff" },
    { done: academy._count.teams > 0, label: "สร้างทีม", hint: `${academy._count.teams} ทีม`, href: "/academies/portal/teams" },
    { done: players > 0, label: "กรอกรายชื่อนักเตะ", hint: `${players} คน`, href: "/academies/portal/teams" },
    {
      done: !!openApp || state === "active",
      label: openApp ? "ติดตามใบสมัคร" : "ยื่นใบสมัคร",
      hint: openApp ? APPLICATION_STATUS[openApp.status].label : state === "active" ? "ใบอนุญาตมีผลอยู่" : "แนบหลักฐานตามเกณฑ์แล้วส่งให้สมาคมฯ",
      href: openApp ? `/academies/portal/applications/${openApp.id}` : "/academies/portal/applications",
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);

  const tiles: { label: string; value: React.ReactNode; hint: string; href: string; icon: LucideIcon; tone: Tone; warn?: boolean }[] = [
    { label: "บุคลากร", value: academy._count.staff, hint: hasHead ? "มีหัวหน้าอคาเดมีแล้ว" : "ยังไม่มีหัวหน้าอคาเดมี", warn: !hasHead, href: "/academies/portal/staff", icon: Users, tone: "violet" },
    { label: "ทีม", value: academy._count.teams, hint: academy._count.teams ? `ผ่านเกณฑ์จำนวนนักเตะ ${teamsOk}/${academy._count.teams} ทีม` : "ยังไม่มีทีม", warn: teamsOk < academy._count.teams || !academy._count.teams, href: "/academies/portal/teams", icon: Shirt, tone: "emerald" },
    { label: "นักเตะ", value: players, hint: `ผู้รักษาประตู ${keepers} คน`, href: "/academies/portal/teams", icon: Trophy, tone: "orange" },
    {
      label: "ใบสมัคร",
      value: academy._count.applications,
      hint: openApp ? `กำลังดำเนินการ: ${APPLICATION_STATUS[openApp.status].label}` : "ไม่มีใบที่ค้างอยู่",
      warn: openApp?.status === "NEEDS_FIX",
      href: openApp ? `/academies/portal/applications/${openApp.id}` : "/academies/portal/applications",
      icon: FileCheck2,
      tone: "sky",
    },
  ];

  return (
    <div className="space-y-6">
      {/* แผงหลักแบบโปสเตอร์: เหรียญระดับ + ชื่ออคาเดมี + อายุใบอนุญาต · ขวา: ความคืบหน้าและขั้นต่อไป */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-[#1e96dc] p-5 text-[#0b1220] sm:p-8">
        <span aria-hidden className="absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full bg-white/15" />
        <span aria-hidden className="absolute -bottom-16 -left-12 -z-10 h-40 w-40 rounded-full border-2 border-dashed border-white/50" />
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
            <Coin level={level} className="w-24 flex-none drop-shadow-[0_6px_0_rgb(11_18_32/0.25)] sm:w-32" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em]">Academy Portal</p>
              <h1 className={`${P} mt-1 text-3xl font-extrabold leading-tight sm:text-4xl`}>{academy.nameEn}</h1>
              {academy.nameTh && <p className="mt-0.5 text-sm font-medium text-[#0b1220]/75">{academy.nameTh}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#ffd426] px-2.5 py-1 text-sm font-bold shadow-[0_3px_0_#0b1220]">
                  {level ? `FAT ${LEVEL_META[level].label} Level` : "ยังไม่มีใบอนุญาต"}
                  {current?.tier && <span className="font-semibold opacity-70">· {tierLabel(current.tier)}</span>}
                </span>
                {current && <span className="rounded-lg bg-white px-2.5 py-1 text-sm font-semibold">{STATE_META[state].label}</span>}
              </div>
              {current && (
                <div className="mt-4 max-w-md">
                  <p className="flex flex-wrap justify-between gap-x-3 text-xs font-semibold">
                    <span>
                      {current.licenceNo && `${current.licenceNo} · `}มีผลถึง {current.expiresAt ? thaiDate(current.expiresAt) : "ไม่ระบุ"}
                    </span>
                    {daysLeft !== null && <span>{daysLeft > 0 ? `เหลืออีก ${daysLeft} วัน` : "หมดอายุแล้ว"}</span>}
                  </p>
                  {span > 0 && (
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#0b1220]/15">
                      <div className={`h-full rounded-full ${daysLeft !== null && daysLeft <= 60 ? "bg-[#ffd426]" : "bg-white"}`} style={{ width: `${100 - used}%` }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_6px_0_rgb(11_18_32/0.2)]">
            <p className="text-sm font-semibold text-slate-500">ความคืบหน้าของอคาเดมี</p>
            <p className={`${P} mt-1 text-4xl font-extrabold text-[#0b1220]`}>
              {doneCount}
              <span className="text-xl text-slate-400">/{steps.length} ขั้นตอน</span>
            </p>
            <div className="mt-3 flex gap-1.5" aria-hidden>
              {steps.map((s) => (
                <span key={s.label} className={`h-2 flex-1 rounded-full ${s.done ? "bg-emerald-500" : "bg-slate-200"}`} />
              ))}
            </div>
            {next ? (
              <Link href={next.href} className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-[#0b1220] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b2230]">
                <span>
                  <span className="block text-[11px] font-semibold text-[#ffd426]">ขั้นต่อไป</span>
                  {next.label}
                </span>
                <ArrowRight className="h-5 w-5 flex-none text-[#ffd426]" />
              </Link>
            ) : (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                ครบทุกขั้นตอนแล้ว
              </p>
            )}
            {showPublicly(academy.active, state) && (
              <Link href={`/academies/${academy.id}`} className="mt-2 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-[#0b6cb0] hover:bg-[#e6f3fc]">
                <ExternalLink className="h-4 w-4" />
                ดูหน้าสาธารณะของอคาเดมี
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ตัวเลขหลัก — กดเข้าไปจัดการได้ทันที */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tiles.map(({ label, value, hint, href, icon: Icon, tone, warn }) => (
          <Link key={label} href={href} className={`group flex flex-col rounded-2xl border border-t-4 border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)] transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${TONES[tone].bar}`}>
            <span className="flex items-center gap-2 text-sm font-bold text-[#0b1220]">
              <Icon className={`h-4.5 w-4.5 ${TONES[tone].icon}`} />
              {label}
            </span>
            <span className={`${P} mt-2 text-4xl font-extrabold text-[#0b1220]`}>{value}</span>
            <span className={`mt-1 flex-1 text-xs ${warn ? "font-semibold text-amber-700" : "text-slate-500"}`}>{hint}</span>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#0b6cb0] group-hover:gap-2">
              จัดการ <ArrowRight className="h-3.5 w-3.5 transition-all" />
            </span>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="ขั้นตอนสู่ใบอนุญาต" icon={ListChecks} flush>
          <ol className="space-y-1 p-3">
            {steps.map((s, i) => {
              const isNext = s === next;
              return (
                <li key={s.label}>
                  <Link href={s.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${isNext ? "bg-[#e6f3fc] ring-1 ring-[#9fd0f0]" : "hover:bg-slate-50"}`}>
                    <span
                      className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-bold ${
                        s.done ? "bg-emerald-500 text-white" : isNext ? "bg-[#1e96dc] text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {s.done ? <Check className="h-4.5 w-4.5" aria-label="เสร็จแล้ว" /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm ${s.done ? "text-slate-500" : "font-semibold text-[#0b1220]"}`}>{s.label}</span>
                      <span className="block truncate text-xs text-slate-500">{s.hint}</span>
                    </span>
                    {isNext ? (
                      <span className="flex-none rounded-lg bg-[#1e96dc] px-2.5 py-1 text-xs font-bold text-white">ทำต่อ</span>
                    ) : (
                      <ArrowRight className="h-4 w-4 flex-none text-slate-300" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </Card>

        <Card title="ความพร้อมตามเกณฑ์ที่ระบบตรวจให้" icon={Gauge} tone="amber">
          <p className="-mt-1 text-xs text-slate-500">นับจากรายชื่อบุคลากรและทีมที่กรอกไว้ — เกณฑ์ข้ออื่นตรวจจากเอกสารในใบสมัคร</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="py-2 font-medium">เกณฑ์</th>
                  {ACADEMY_LEVELS.map((l) => (
                    <th key={l} className="w-18 py-2 text-center font-bold" style={{ color: LEVEL_TEXT[l] }}>
                      <Coin level={l} className="mx-auto mb-0.5 w-7" />
                      {LEVEL_META[l].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(AUTO_LABELS).map(([code, label]) => (
                  <tr key={code}>
                    <td className="py-2.5 text-slate-700">
                      {label} <span className="text-xs text-slate-400">({code})</span>
                    </td>
                    {ACADEMY_LEVELS.map((l) => {
                      const r = autoChecks(l, check.staff, check.teams)[code];
                      // บางเกณฑ์ไม่มีในบางระดับ (เช่น Bronze ไม่มีข้อ 1.6.2 ตามเกณฑ์ 2025)
                      if (!r)
                        return (
                          <td key={l} className="py-2.5 text-center text-slate-300" title="ระดับนี้ไม่มีเกณฑ์ข้อนี้">
                            —
                          </td>
                        );
                      return (
                        <td key={l} className="py-2.5 text-center" title={r.detail}>
                          {r.ok ? <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" aria-label="ผ่าน" /> : <XCircle className="mx-auto h-5 w-5 text-slate-300" aria-label="ยังไม่ผ่าน" />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-400">ชี้ที่เครื่องหมายเพื่อดูรายละเอียด</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="ใบสมัคร"
          icon={FileCheck2}
          flush
          actions={
            <Link href="/academies/portal/applications" className="text-xs font-bold text-[#0b6cb0] hover:underline">
              ทั้งหมด →
            </Link>
          }
        >
          {academy.applications.length === 0 ? (
            <div className="p-5">
              <Link href="/academies/portal/applications" className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-[#9fd0f0] p-4 text-sm font-bold text-[#0b6cb0] hover:bg-[#e6f3fc]">
                <FileCheck2 className="h-5 w-5" />
                ยื่นใบสมัครขอใบอนุญาต
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {academy.applications.map((a) => {
                const reviewed = a.evidence.filter((e) => e.status !== "PENDING").length;
                return (
                  <li key={a.id}>
                    <Link href={`/academies/portal/applications/${a.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-[#f4f8fc]">
                      <Coin level={isLevel(a.level) ? a.level : null} className="w-9 flex-none" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-[#0b1220]">
                          FAT {LEVEL_META[a.level as keyof typeof LEVEL_META]?.label} · {APPLICATION_KINDS[a.kind]}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {a.submittedAt ? `ส่งเมื่อ ${thaiDate(a.submittedAt)}` : `เริ่มเมื่อ ${thaiDate(a.createdAt)}`} · ตรวจแล้ว {reviewed}/{a.evidence.length} ข้อ
                        </span>
                      </span>
                      <span className={`flex-none rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${APPLICATION_STATUS[a.status].tone}`}>{APPLICATION_STATUS[a.status].label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card
          title="การแจ้งเตือนล่าสุด"
          icon={Bell}
          tone="orange"
          flush
          actions={
            <Link href="/academies/portal/notices" className="text-xs font-bold text-[#0b6cb0] hover:underline">
              ทั้งหมด →
            </Link>
          }
        >
          {notices.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-400">ยังไม่มีการแจ้งเตือน</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {notices.map((n) => (
                <li key={n.id}>
                  <Link href={n.link ?? "/academies/portal/notices"} className="flex gap-3 px-5 py-3 hover:bg-[#f4f8fc]">
                    <span aria-hidden className={`mt-1.5 h-2 w-2 flex-none rounded-full ${n.readAt ? "bg-slate-200" : "bg-orange-500"}`} />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm ${n.readAt ? "text-slate-600" : "font-semibold text-[#0b1220]"}`}>{n.title}</span>
                      <span className="block text-xs text-slate-400">{n.createdAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" })}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
