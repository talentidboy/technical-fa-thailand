"use client";

import { Printer, Download, Users, IdCard, GraduationCap, Building2 } from "lucide-react";
import type { HeroSummary } from "@/lib/coach-query";
import { LICENSE_TYPES } from "@/lib/constants";

const LICENSE_LABEL_MAP = Object.fromEntries(
  LICENSE_TYPES.map((t) => [t.value, t.label]),
);

// ไล่โทนกรมท่า (แบรนด์ FA Thailand) จากฐานพีระมิดไปยอด ปิดท้ายด้วยทอง = ระดับสูงสุด
const TIER_COLORS: Record<string, string> = {
  G: "#5a7cbe",
  C: "#2f5799",
  B: "#1a3a6b",
  A: "#142f57",
  PRO: "#c9a227",
};
export function DashboardHero({ summary }: { summary: HeroSummary }) {
  const { total, withAfc, clubsCovered, latestYear, trainedLatestYear } = summary;

  const rawPyramidData = summary.pyramid.map((d) => ({
    tier: d.tier,
    label: LICENSE_LABEL_MAP[d.tier] ?? d.tier,
    count: d.count,
  }));
  const max = Math.max(...rawPyramidData.map((d) => d.count), 1);
  const tierTotal = rawPyramidData.reduce((sum, d) => sum + d.count, 0);
  const sideCounts = summary.sideCounts.map((d) => ({
    label: LICENSE_LABEL_MAP[d.tier] ?? d.tier,
    count: d.count,
  }));

  const badges = [
    {
      icon: Users,
      value: total.toLocaleString(),
      label: "ผู้ฝึกสอนทั้งหมดในระบบ",
    },
    {
      icon: IdCard,
      value: withAfc.toLocaleString(),
      label: "มีเลข ID AFC แล้ว",
    },
    {
      icon: GraduationCap,
      value: latestYear != null ? trainedLatestYear.toLocaleString() : "-",
      label:
        latestYear != null
          ? `จบอบรมในปี ${latestYear} (ล่าสุด)`
          : "ยังไม่มีข้อมูลปีที่อบรม",
    },
    {
      icon: Building2,
      value: clubsCovered.toLocaleString(),
      label: "สโมสรที่มีข้อมูลผู้ฝึกสอน",
    },
  ];

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      {/* หัวรายงาน — พื้นกรมท่า + ตัวเลขสรุปเป็นการ์ดโปร่ง */}
      <div className="relative isolate overflow-hidden bg-linear-to-br from-indigo-900 via-indigo-800 to-indigo-700 p-6 text-white sm:p-8">
        <div aria-hidden className="absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.06]"
          style={{
            backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">FAT · Coaching Education Report</p>
            <h1 className="text-xl font-extrabold leading-snug sm:text-2xl">สรุปข้อมูลผู้ฝึกสอนฟุตบอลไทย จากฐานข้อมูลใบอนุญาต AFC/FAT</h1>
            <p className="mt-2 text-xs leading-relaxed text-indigo-200 sm:text-sm">
              นับทุกแถวที่มีชื่อในระบบ (รวมผู้ที่ยังไม่ได้รับเลข ID AFC) — ดูรายละเอียดและกรองข้อมูลได้ที่แท็บ &quot;รายงานเชิงลึก&quot;
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/20"
            >
              <Printer className="h-3.5 w-3.5" />
              พิมพ์ / บันทึก PDF
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download endpoint, not a page route */}
            <a
              href="/coaches/export"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-amber-950 shadow-sm transition-colors hover:bg-amber-300"
            >
              <Download className="h-3.5 w-3.5" />
              ส่งออก Excel (ทั้งหมด)
            </a>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {badges.map((b) => (
            <div key={b.label} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
              <b.icon className="h-4.5 w-4.5 text-amber-300" strokeWidth={2} />
              <div className="mt-2 text-2xl font-extrabold leading-none sm:text-3xl">{b.value}</div>
              <div className="mt-1.5 text-[11px] leading-snug text-indigo-200">{b.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 sm:p-8">
      {/* จำนวนผู้ฝึกสอนตามระดับใบอนุญาต — แท่งแนวนอน เรียงจากระดับสูงสุด (PRO) ลงมา
          (เลิกใช้รูปพีระมิดโค้ง: ข้อมูลต่างกันมาก 68 กับ 5,794 ทำให้รูปทรงคอดกลางดูไม่เหมาะ และอ่านค่ายาก) */}
      <div>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">
            จำนวนผู้ฝึกสอนตามระดับใบอนุญาต <span className="font-normal text-slate-400">(ใบอนุญาตปัจจุบัน · ทั้งระบบ)</span>
          </h2>
          <span className="text-xs text-slate-500">
            รวม <b className="text-slate-900">{tierTotal.toLocaleString()}</b> คน
          </span>
        </div>
        <ul className="space-y-2">
          {rawPyramidData.map((d) => {
            const pct = tierTotal > 0 ? (d.count / tierTotal) * 100 : 0;
            // ค่าน้อยมากยังเห็นแท่งเป็นขีดเล็กๆ (ไม่หายไปเลย) — ตัวเลขจริงอยู่ด้านขวาเสมอ
            const width = d.count === 0 ? 0 : Math.max(1.5, (d.count / max) * 100);
            const color = TIER_COLORS[d.tier] ?? "#94a3b8";
            return (
              <li
                key={d.tier}
                title={`${d.label}: ${d.count.toLocaleString()} คน (${pct.toFixed(1)}%)`}
                className="group grid grid-cols-[4.5rem_minmax(0,1fr)_7.5rem] items-center gap-3 rounded-lg px-1.5 py-1 transition-colors hover:bg-slate-50 sm:grid-cols-[5.5rem_minmax(0,1fr)_8.5rem]"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span className="h-3 w-3 flex-none rounded-sm" style={{ backgroundColor: color }} />
                  {d.label}
                </span>
                <span className="relative h-6 overflow-hidden rounded-[4px] bg-slate-100">
                  <span
                    className="absolute inset-y-0 left-0 rounded-r-[4px] transition-opacity group-hover:opacity-85"
                    style={{ width: `${width}%`, backgroundColor: color }}
                  />
                </span>
                <span className="text-right text-sm tabular-nums">
                  <b className="text-slate-900">{d.count.toLocaleString()}</b>
                  <span className="ml-1.5 text-xs text-slate-400">{pct.toFixed(1)}%</span>
                </span>
              </li>
            );
          })}
        </ul>
        {sideCounts.length > 0 && (
          <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400">
            นับจากใบอนุญาตปัจจุบันของแต่ละคน (คอลัมน์ LICENSE) · ใบอนุญาตเฉพาะทางที่ไม่อยู่ในลำดับหลัก:{" "}
            {sideCounts.map((d) => `${d.label} (${d.count})`).join(" · ")}
          </p>
        )}
      </div>
      </div>
    </div>
  );
}
