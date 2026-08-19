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
// ระดับ PRO พื้นทอง ต้องใช้ตัวอักษรเข้มแทนขาวเพื่อความคมชัด (contrast 2.4:1 ไม่พอสำหรับตัวขาว)
const TIER_TEXT_DARK = new Set(["PRO"]);

const CONTAINER_W = 300;
const TIER_H = 60;

type Point = { x: number; y: number };

// Catmull-Rom -> cubic Bezier, so the pyramid silhouette is one continuous
// curve instead of straight-line trapezoid segments meeting at visible kinks.
function smoothPathSegment(points: Point[]) {
  let d = "";
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export function DashboardHero({ summary }: { summary: HeroSummary }) {
  const { total, withAfc, clubsCovered, latestYear, trainedLatestYear } = summary;

  const rawPyramidData = summary.pyramid.map((d) => ({
    tier: d.tier,
    label: LICENSE_LABEL_MAP[d.tier] ?? d.tier,
    count: d.count,
  }));
  const max = Math.max(...rawPyramidData.map((d) => d.count), 1);
  const pyramidData = rawPyramidData.map((d) => ({
    ...d,
    widthPct: d.count === 0 ? 16 : 22 + (d.count / max) * 78,
  }));
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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600">
            FAT · Coaching Education Report
          </p>
          <h1 className="text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
            สรุปข้อมูลผู้ฝึกสอนฟุตบอลไทย จากฐานข้อมูลใบอนุญาต AFC/FAT
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
            นับทุกแถวที่มีชื่อในระบบ (รวมผู้ที่ยังไม่ได้รับเลข ID AFC) — เลื่อนหน้าลงเพื่อกรองและสำรวจข้อมูลเชิงลึกได้ตามต้องการ
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5" />
            พิมพ์ / บันทึก PDF
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download endpoint, not a page route */}
          <a
            href="/coaches/export"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
          >
            <Download className="h-3.5 w-3.5" />
            ส่งออก Excel (ทั้งหมด)
          </a>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {badges.map((b) => (
          <div
            key={b.label}
            className="rounded-xl border border-slate-100 bg-slate-50 p-4"
          >
            <b.icon className="h-4 w-4 text-indigo-400" strokeWidth={2} />
            <div className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
              {b.value}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">{b.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-8 border-t border-slate-100 pt-8">
        {(() => {
          const n = pyramidData.length;
          const halfWidthAt = (i: number) => {
            if (i === 0) {
              return (pyramidData[0].widthPct / 100) * (CONTAINER_W / 2) * 0.5;
            }
            return (pyramidData[i - 1].widthPct / 100) * (CONTAINER_W / 2);
          };
          const rightPoints: Point[] = Array.from({ length: n + 1 }, (_, i) => ({
            x: CONTAINER_W / 2 + halfWidthAt(i),
            y: i * TIER_H,
          }));
          const leftPointsRev: Point[] = Array.from({ length: n + 1 }, (_, i) => ({
            x: CONTAINER_W / 2 - halfWidthAt(n - i),
            y: (n - i) * TIER_H,
          }));
          const outlineD =
            `M ${rightPoints[0].x},${rightPoints[0].y}` +
            smoothPathSegment(rightPoints) +
            ` L ${leftPointsRev[0].x},${leftPointsRev[0].y}` +
            smoothPathSegment(leftPointsRev) +
            " Z";
          const totalH = n * TIER_H;

          return (
            <div className="relative w-75" style={{ height: totalH }}>
              <svg
                viewBox={`0 0 ${CONTAINER_W} ${totalH}`}
                width={CONTAINER_W}
                height={totalH}
                className="block"
              >
                <defs>
                  {pyramidData.map((d, i) => (
                    <clipPath id={`tier-clip-${d.tier}`} key={d.tier}>
                      <rect x={0} y={i * TIER_H} width={CONTAINER_W} height={TIER_H} />
                    </clipPath>
                  ))}
                </defs>
                {pyramidData.map((d) => (
                  <path
                    key={d.tier}
                    d={outlineD}
                    fill={TIER_COLORS[d.tier] ?? "#94a3b8"}
                    clipPath={`url(#tier-clip-${d.tier})`}
                  />
                ))}
                <path d={outlineD} fill="none" stroke="#ffffff" strokeWidth={2} />
              </svg>
              {pyramidData.map((d, i) => (
                <div
                  key={d.tier}
                  className={`pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-center ${
                    TIER_TEXT_DARK.has(d.tier) ? "text-indigo-900" : "text-white"
                  }`}
                  style={{ top: (i + 0.5) * TIER_H }}
                >
                  <div className="text-base font-bold tabular-nums leading-tight">
                    {d.count.toLocaleString()}
                  </div>
                  <div className="text-[11px] font-medium leading-tight opacity-90">
                    {d.label}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        <div className="min-w-55 flex-1">
          <p className="mb-2 text-xs font-semibold text-slate-400">
            พีระมิดใบอนุญาตผู้ฝึกสอน (ภาพรวมทั้งระบบ)
          </p>
          <div className="flex flex-col gap-1.5">
            {pyramidData.map((d) => (
              <div
                key={d.tier}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm"
              >
                <span
                  className="h-3 w-3 flex-none rounded-sm"
                  style={{ backgroundColor: TIER_COLORS[d.tier] ?? "#94a3b8" }}
                />
                <span className="flex-1 font-medium text-slate-700">{d.label}</span>
                <span className="font-bold text-slate-900">
                  {d.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          {sideCounts.length > 0 && (
            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
              นับจากใบอนุญาตปัจจุบันของแต่ละคน (คอลัมน์ LICENSE) · ใบอนุญาตเฉพาะทางที่ไม่อยู่ในพีระมิดหลัก:{" "}
              {sideCounts.map((d) => `${d.label} (${d.count})`).join(" · ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
