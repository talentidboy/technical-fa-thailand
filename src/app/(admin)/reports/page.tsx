import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { loadTrainingReport, parseYearRange, thaiYear, REPORT_LEVELS, LEVEL_LABEL, type ReportLevel } from "@/lib/training-report";
import { SESSION_STATUS } from "@/lib/course-workflow";
import { FixBuddhistYearsButton } from "@/components/report/FixBuddhistYearsButton";
import { FileSpreadsheet, FileBadge, Users, UserPlus, ArrowUpCircle, RefreshCw, AlertTriangle, MapPin, BookOpen, Copy, UserCheck, Combine } from "lucide-react";

const be = (y: number) => y + 543;
const fmt = (n: number) => (n === 0 ? "–" : n.toLocaleString());
const pct = (n: number | null) => (n == null ? "–" : `${Math.round(n * 100)}%`);
const dateTh = (d: Date | null) => (d ? d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit", timeZone: "Asia/Bangkok" }) : "–");

function Card({ title, sub, icon: Icon, children, action }: { title: string; sub?: string; icon: typeof Users; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          {sub && <p className="text-xs text-slate-400">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// ตารางจำนวนแยกตามระดับ (แถว = ปี / ภูมิภาค / เพศ) พร้อมแท่งรวมของแต่ละแถว
function LevelTable({
  head,
  rows,
  totals,
}: {
  head: string;
  rows: { key: string; label: React.ReactNode; counts: Record<ReportLevel, number>; total: number }[];
  totals: Record<ReportLevel, number>;
}) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  const grand = REPORT_LEVELS.reduce((s, l) => s + totals[l], 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
          <tr>
            <th className="px-4 py-2.5 text-left">{head}</th>
            {REPORT_LEVELS.map((l) => (
              <th key={l} className="px-2 py-2.5 text-right">
                {LEVEL_LABEL[l]}
              </th>
            ))}
            <th className="px-3 py-2.5 text-right">รวม</th>
            <th className="w-[22%] px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.key} className="hover:bg-slate-50/60">
              <td className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-800">{r.label}</td>
              {REPORT_LEVELS.map((l) => (
                <td key={l} className={`px-2 py-2.5 text-right tabular-nums ${r.counts[l] ? "text-slate-700" : "text-slate-300"}`}>
                  {fmt(r.counts[l])}
                </td>
              ))}
              <td className="px-3 py-2.5 text-right font-bold tabular-nums text-slate-900">{fmt(r.total)}</td>
              <td className="px-4 py-2.5">
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${(r.total / max) * 100}%` }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
          <tr>
            <td className="px-4 py-2.5">รวม</td>
            {REPORT_LEVELS.map((l) => (
              <td key={l} className="px-2 py-2.5 text-right tabular-nums">
                {fmt(totals[l])}
              </td>
            ))}
            <td className="px-3 py-2.5 text-right tabular-nums">{grand.toLocaleString()}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default async function TrainingReportPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const [user, sp] = await Promise.all([getCurrentUser(), searchParams]);
  const now = new Date();
  const currentYear = thaiYear(now);
  const { fromYear, toYear } = parseYearRange(sp.from, sp.to, currentYear);
  const r = await loadTrainingReport(fromYear, toYear, now);
  const isAdmin = user?.role === "ADMIN";
  const fixable = r.issues.filter((i) => i.buddhistYear).length;

  const yearOptions: number[] = [];
  for (let y = currentYear; y >= r.minYear; y--) yearOptions.push(y);
  const presets = [
    { label: "ปีนี้", from: currentYear, to: currentYear },
    { label: "5 ปีล่าสุด", from: currentYear - 4, to: currentYear },
    { label: "10 ปีล่าสุด", from: currentYear - 9, to: currentYear },
    { label: "ทั้งหมด", from: r.minYear, to: currentYear },
  ];
  const rangeLabel = fromYear === toYear ? `ปี ${be(fromYear)}` : `ปี ${be(fromYear)}–${be(toYear)}`;
  const regionTotals = r.byRegion.reduce(
    (acc, row) => {
      for (const l of REPORT_LEVELS) acc[l] += row.counts[l];
      return acc;
    },
    { PRO: 0, A: 0, B: 0, C: 0, G: 0, GK: 0, OTHER: 0 } as Record<ReportLevel, number>,
  );
  const maxProvince = Math.max(1, ...r.topProvinces.map((p) => p.total));
  const genderTotal = r.byGender.reduce((s, g) => s + g.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">รายงานสรุปการอบรม</h1>
          <p className="mt-1 text-sm text-slate-500">
            ใบอนุญาตที่ออกแยกตามปี ระดับ ภูมิภาค และเพศ · รุ่นอบรม · การต่ออายุ — {rangeLabel}
          </p>
        </div>
        <a
          href={`/reports/export?from=${fromYear}&to=${toYear}`}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-200 transition-colors hover:bg-emerald-700"
        >
          <FileSpreadsheet className="h-4 w-4" />
          ดาวน์โหลด Excel
        </a>
      </div>

      {/* ช่วงปี */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => {
            const on = p.from === fromYear && p.to === toYear;
            return (
              <Link
                key={p.label}
                href={`/reports?from=${p.from}&to=${p.to}`}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 ${on ? "bg-indigo-600 text-white ring-indigo-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`}
              >
                {p.label}
              </Link>
            );
          })}
        </div>
        <form action="/reports" className="flex flex-wrap items-center gap-2 text-sm sm:ml-auto">
          <span className="text-slate-500">ตั้งแต่ปี</span>
          <select name="from" defaultValue={fromYear} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {be(y)}
              </option>
            ))}
          </select>
          <span className="text-slate-500">ถึง</span>
          <select name="to" defaultValue={toYear} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {be(y)}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-slate-900 px-3.5 py-1.5 font-semibold text-white hover:bg-slate-700">
            ดูรายงาน
          </button>
        </form>
      </div>

      {/* ตัวเลขหลัก */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: "ใบอนุญาตที่ออก", value: r.kpi.issued, icon: FileBadge, tone: "bg-indigo-50 text-indigo-600" },
          { label: "ผู้ฝึกสอนที่ได้รับ", value: r.kpi.coaches, icon: Users, tone: "bg-sky-50 text-sky-600" },
          { label: "ผู้ฝึกสอนใหม่ (ใบแรก)", value: r.kpi.newCoaches, icon: UserPlus, tone: "bg-emerald-50 text-emerald-600" },
          { label: "อัปเกรดระดับ", value: r.kpi.upgrades, icon: ArrowUpCircle, tone: "bg-amber-50 text-amber-600" },
          { label: "ต่ออายุใบอนุญาต", value: r.kpi.renewals, icon: RefreshCw, tone: "bg-violet-50 text-violet-600" },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-4.5 w-4.5" />
            </span>
            <p className="mt-3 text-2xl font-extrabold tabular-nums text-slate-900">{value.toLocaleString()}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <Card title="ใบอนุญาตที่ออก แยกตามปีและระดับ" sub="นับตามวันที่ออกใบ · GK = ผู้รักษาประตูทุกระดับ · อื่น ๆ = ใบเฉพาะทางอื่น" icon={FileBadge}>
        <LevelTable
          head="ปี (พ.ศ.)"
          rows={r.byYear.map((y) => ({
            key: String(y.year),
            label: (
              <>
                {be(y.year)} <span className="text-xs font-normal text-slate-400">{y.year}</span>
              </>
            ),
            counts: y.counts,
            total: y.total,
          }))}
          totals={r.levelTotals}
        />
      </Card>

      <Card title="แยกตามภูมิภาค" sub="จากจังหวัดที่พำนักของผู้ฝึกสอน (6 ภูมิภาค) — ผู้ที่ยังไม่ได้กรอกจังหวัดอยู่ในแถว “ไม่ระบุจังหวัด”" icon={MapPin}>
        <LevelTable head="ภูมิภาค" rows={r.byRegion.map((x) => ({ key: x.key, label: x.label, counts: x.counts, total: x.total }))} totals={regionTotals} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="10 จังหวัดสูงสุด" icon={MapPin}>
          {r.topProvinces.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">ไม่มีข้อมูลจังหวัดในช่วงปีนี้</p>
          ) : (
            <ol className="space-y-2.5 p-5">
              {r.topProvinces.map((p, i) => (
                <li key={p.code} className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-right text-xs font-bold text-slate-400">{i + 1}</span>
                  <span className="w-32 truncate font-medium text-slate-800">{p.name}</span>
                  <div className="h-2 flex-1 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-sky-500" style={{ width: `${(p.total / maxProvince) * 100}%` }} />
                  </div>
                  <span className="w-12 text-right font-semibold tabular-nums text-slate-900">{p.total.toLocaleString()}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="แยกตามเพศ" icon={Users}>
          <ul className="space-y-4 p-5">
            {r.byGender.map((g) => (
              <li key={g.key}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-slate-800">{g.label}</span>
                  <span className="tabular-nums text-slate-900">
                    <b>{g.total.toLocaleString()}</b>{" "}
                    <span className="text-xs text-slate-400">{genderTotal ? `${Math.round((g.total / genderTotal) * 100)}%` : ""}</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${genderTotal ? (g.total / genderTotal) * 100 : 0}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {REPORT_LEVELS.filter((l) => g.counts[l] > 0)
                    .map((l) => `${LEVEL_LABEL[l]} ${g.counts[l].toLocaleString()}`)
                    .join(" · ") || "–"}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="รุ่นอบรมในระบบ" sub="รุ่นที่เปิดผ่านเมนูหลักสูตรอบรม (เริ่มอบรมในช่วงปีที่เลือก)" icon={BookOpen}>
        {r.sessions.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">ยังไม่มีรุ่นอบรมในช่วงปีนี้</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 text-left">รุ่น</th>
                  <th className="px-3 py-2.5 text-left">วันที่อบรม</th>
                  <th className="px-3 py-2.5 text-right">สมัคร</th>
                  <th className="px-3 py-2.5 text-right">เข้าอบรม</th>
                  <th className="px-3 py-2.5 text-right">ผ่าน</th>
                  <th className="px-3 py-2.5 text-right">ไม่ผ่าน</th>
                  <th className="px-4 py-2.5 text-right">อัตราผ่าน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {r.sessions.map((s) => {
                  const st = SESSION_STATUS[s.status] ?? SESSION_STATUS.CLOSED;
                  return (
                    <tr key={s.id}>
                      <td className="px-4 py-2.5">
                        <Link href={`/course-sessions/${s.id}`} className="font-medium text-slate-900 hover:text-indigo-700">
                          {s.title} · {s.name}
                        </Link>
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${st.className}`}>{st.label}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">
                        {dateTh(s.startDate)} – {dateTh(s.endDate)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{fmt(s.applicants)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{fmt(s.approved)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-emerald-700">{fmt(s.passed)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-red-600">{fmt(s.failed)}</td>
                      <td className="px-4 py-2.5 text-right font-bold tabular-nums">{pct(s.passRate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="การต่ออายุใบอนุญาต" sub={`อนุมัติต่ออายุใน${rangeLabel}`} icon={RefreshCw}>
        <div className="flex flex-wrap gap-2 p-5">
          {REPORT_LEVELS.filter((l) => r.renewalCounts[l] > 0).length === 0 ? (
            <p className="text-sm text-slate-400">ยังไม่มีการต่ออายุในช่วงปีนี้</p>
          ) : (
            REPORT_LEVELS.filter((l) => r.renewalCounts[l] > 0).map((l) => (
              <span key={l} className="rounded-xl bg-violet-50 px-3.5 py-2 text-sm text-violet-800">
                <b>{LEVEL_LABEL[l]}</b> {r.renewalCounts[l].toLocaleString()} ใบ
              </span>
            ))
          )}
        </div>
      </Card>

      {r.issues.length > 0 && (
        <Card
          title={`ข้อมูลที่ควรตรวจสอบ (${r.issues.length.toLocaleString()} รายการ)`}
          sub="วันที่ออกใบผิดปกติ — ไม่ถูกนับในรายงาน ควรแก้ก่อนส่งรายงานให้ AFC"
          icon={AlertTriangle}
          action={isAdmin && fixable > 0 ? <FixBuddhistYearsButton count={fixable} /> : null}
        >
          <ul className="divide-y divide-slate-100">
            {r.issues.slice(0, 50).map((i) => (
              <li key={i.recordId} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5 text-sm">
                <Link href={`/coaches/${i.coachId}`} className="font-medium text-slate-900 hover:text-indigo-700">
                  {i.coachName}
                </Link>
                <span className="rounded-md bg-indigo-600 px-1.5 py-0.5 text-[11px] font-black text-white">{i.licenseType}</span>
                {i.certificateNo && <span className="text-xs text-slate-400">{i.certificateNo}</span>}
                <span className={`text-xs font-semibold ${i.buddhistYear ? "text-amber-700" : "text-red-600"}`}>{i.problem}</span>
              </li>
            ))}
          </ul>
          {r.issues.length > 50 && <p className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-400">แสดง 50 รายการแรก — ดูทั้งหมดในไฟล์ Excel</p>}
        </Card>
      )}

      <Card
        title="ความครบถ้วนของข้อมูลผู้ฝึกสอน"
        sub={`ผู้ฝึกสอนที่มีใบอนุญาต ${r.completeness.coaches.toLocaleString()} คน — ข้อมูลครบ ${r.completeness.complete.toLocaleString()} คน · รายชื่อคนที่ข้อมูลไม่ครบอยู่ในไฟล์ Excel`}
        icon={UserCheck}
      >
        <ul className="grid grid-cols-1 gap-x-8 gap-y-3 p-5 sm:grid-cols-2">
          {r.completeness.fields.map((f) => {
            const pctHas = r.completeness.coaches ? (f.has / r.completeness.coaches) * 100 : 0;
            return (
              <li key={f.key}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-slate-800">{f.label}</span>
                  <span className="tabular-nums text-slate-500">
                    มี <b className="text-slate-900">{f.has.toLocaleString()}</b> · ขาด {f.missing.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-slate-100">
                  <div className={`h-2 rounded-full ${pctHas >= 80 ? "bg-emerald-500" : pctHas >= 40 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${pctHas}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {r.duplicates.length > 0 && (
        <Card
          title={`ผู้ฝึกสอนที่อาจซ้ำกัน (${r.duplicates.length} ชื่อ)`}
          sub="ชื่อ-สกุลไทยตรงกันหลายประวัติ — ตรวจว่าเป็นคนเดียวกันหรือไม่ ถ้าใช่ ควรรวมใบอนุญาตไว้ในประวัติเดียว (คนที่ไม่มีเลขบัตรมักเป็นประวัติเก่า)"
          icon={Copy}
        >
          <ul className="divide-y divide-slate-100">
            {r.duplicates.map((d) => (
              <li key={d.name} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-2.5 text-sm">
                <span className="w-48 flex-none font-medium text-slate-900">{d.name}</span>
                {isAdmin && d.coaches.length === 2 && (
                  <Link
                    href={`/coaches/${d.coaches[0].id}?mergeWith=${d.coaches[1].id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-violet-700"
                  >
                    <Combine className="h-3.5 w-3.5" />
                    รวมประวัติ
                  </Link>
                )}
                {d.coaches.map((c) => (
                  <Link
                    key={c.id}
                    href={`/coaches/${c.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs text-slate-700 ring-1 ring-slate-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    #{c.id} · ใบอนุญาต {c.licenses} ใบ · {c.hasIdNumber ? "มีเลขบัตร" : "ไม่มีเลขบัตร"}
                    {c.afcId ? ` · ${c.afcId}` : ""}
                  </Link>
                ))}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
