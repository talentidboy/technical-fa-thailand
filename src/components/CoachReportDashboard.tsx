"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, RotateCcw, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { AGE_BUCKETS } from "@/lib/coach-report";
import { LICENSE_TYPES, GENDER_OPTIONS } from "@/lib/constants";
import { LICENSE_STATUS_STYLES, type LicenseStatus } from "@/lib/license-status";
import type {
  CoachFilters,
  SortKey,
  CoachTableRow,
  CoachAggregates,
  FilterOptions,
} from "@/lib/coach-query";
import {
  DonutChart,
  CategoryBarChart,
  LicenseTrendChart,
  CATEGORICAL_PALETTE,
  STATUS_COLORS,
} from "@/components/DashboardCharts";

const GENDER_COLORS: Record<string, string> = {
  MALE: CATEGORICAL_PALETTE[0],
  FEMALE: CATEGORICAL_PALETTE[4],
  OTHER: CATEGORICAL_PALETTE[6],
};
const AFC_COLORS: Record<string, string> = {
  yes: STATUS_COLORS.active,
  no: STATUS_COLORS.unknown,
};

const LICENSE_LABEL_MAP = Object.fromEntries(
  LICENSE_TYPES.map((t) => [t.value, t.label]),
);
const GENDER_LABEL_MAP = Object.fromEntries(
  GENDER_OPTIONS.map((g) => [g.value, g.label]),
);
const AFC_LABELS: Record<string, string> = {
  yes: "มี ID แล้ว",
  no: "ยังไม่มี ID",
};

// ต้องตรงกับ PAGE_SIZE ใน src/lib/coach-query.ts — คัดลอกมาไว้ที่นี่แทนการ import
// ค่าเพราะไฟล์นั้นดึง prisma/pg เข้ามาด้วย ซึ่งใช้ใน client component ไม่ได้
const PAGE_SIZE = 50;

type ColumnKey =
  | "afcId"
  | "name"
  | "gender"
  | "nationality"
  | "club"
  | "division"
  | "position"
  | "currentLicenseLabel"
  | "expireDate";

const COLUMNS: { key: ColumnKey; label: string; sortable: boolean }[] = [
  { key: "afcId", label: "ID AFC", sortable: true },
  { key: "name", label: "ชื่อ-นามสกุล", sortable: true },
  { key: "gender", label: "เพศ", sortable: true },
  { key: "nationality", label: "สัญชาติ", sortable: true },
  { key: "club", label: "สโมสร", sortable: true },
  { key: "division", label: "ดิวิชั่น", sortable: true },
  { key: "position", label: "ตำแหน่ง", sortable: true },
  { key: "currentLicenseLabel", label: "ใบอนุญาตปัจจุบัน", sortable: true },
  { key: "expireDate", label: "วันหมดอายุ", sortable: true },
];

function buildQuery(
  filters: CoachFilters,
  sortKey: SortKey,
  sortAsc: boolean,
  page: number,
): string {
  const p = new URLSearchParams();
  if (filters.gender) p.set("gender", filters.gender);
  if (filters.nationality) p.set("nationality", filters.nationality);
  if (filters.residence) p.set("residence", filters.residence);
  if (filters.division) p.set("division", filters.division);
  if (filters.position) p.set("position", filters.position);
  if (filters.currentLicense) p.set("license", filters.currentLicense);
  if (filters.afcId) p.set("afc", filters.afcId);
  if (filters.expStatus) p.set("exp", filters.expStatus);
  if (filters.ageBucket) p.set("age", filters.ageBucket);
  if (filters.year) p.set("year", filters.year);
  if (filters.licenseHeld.length) p.set("held", filters.licenseHeld.join(","));
  if (filters.search) p.set("q", filters.search);
  if (sortKey !== "name") p.set("sort", sortKey);
  if (!sortAsc) p.set("dir", "desc");
  if (page > 0) p.set("page", String(page));
  const qs = p.toString();
  return qs ? `/dashboard?${qs}` : "/dashboard";
}

export function CoachReportDashboard({
  filters,
  sortKey,
  sortAsc,
  page,
  coachPage,
  aggregates,
  filterOptions,
}: {
  filters: CoachFilters;
  sortKey: SortKey;
  sortAsc: boolean;
  page: number;
  coachPage: { rows: CoachTableRow[]; total: number; pageCount: number };
  aggregates: CoachAggregates;
  filterOptions: FilterOptions;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  // debounce การพิมพ์ค้นหา ก่อนยิงไป URL/เซิร์ฟเวอร์
  useEffect(() => {
    if (searchInput === filters.search) return;
    const t = setTimeout(() => {
      go({ ...filters, search: searchInput });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function go(
    nextFilters: CoachFilters,
    nextSort: SortKey = sortKey,
    nextAsc: boolean = sortAsc,
    nextPage: number = 0,
  ) {
    startTransition(() => {
      router.push(buildQuery(nextFilters, nextSort, nextAsc, nextPage), {
        scroll: false,
      });
    });
  }

  function updateFilter<K extends keyof CoachFilters>(key: K, value: CoachFilters[K]) {
    go({ ...filters, [key]: value });
  }

  function toggleLicenseHeld(type: string) {
    const held = filters.licenseHeld.includes(type)
      ? filters.licenseHeld.filter((t) => t !== type)
      : [...filters.licenseHeld, type];
    go({ ...filters, licenseHeld: held });
  }

  function toggleSort(key: ColumnKey) {
    if (key === sortKey) go(filters, key, !sortAsc, page);
    else go(filters, key, true, page);
  }

  function goToPage(p: number) {
    go(filters, sortKey, sortAsc, p);
  }

  const { total, withAfc, thaiCount, male, female } = aggregates;

  const hasActiveFilters = Boolean(
    filters.gender ||
      filters.nationality ||
      filters.division ||
      filters.position ||
      filters.currentLicense ||
      filters.afcId ||
      filters.expStatus ||
      filters.ageBucket ||
      filters.year ||
      filters.licenseHeld.length > 0 ||
      filters.search,
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          รายงานสรุปข้อมูลผู้ฝึกสอน (Coaching License Report)
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          กรองและสำรวจข้อมูลเชิงลึกของผู้ฝึกสอนทั้งหมดในระบบ
        </p>
      </div>

      {/* ตัวกรอง */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">ตัวกรองข้อมูล</h3>
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            {isPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
            )}
            แสดง <b className="text-indigo-600">{total.toLocaleString()}</b> คน
          </p>
        </div>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="ค้นหาชื่อ, ID AFC, สโมสร..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <FilterSelect
            label="เพศ"
            value={filters.gender}
            onChange={(v) => updateFilter("gender", v)}
            options={filterOptions.gender.map(([v, c]) => ({
              value: v,
              label: `${GENDER_LABEL_MAP[v] ?? v} (${c})`,
            }))}
          />
          <FilterSelect
            label="สัญชาติ"
            value={filters.nationality}
            onChange={(v) => updateFilter("nationality", v)}
            options={filterOptions.nationality.map(([v, c]) => ({
              value: v,
              label: `${v} (${c})`,
            }))}
          />
          <FilterSelect
            label="จังหวัดที่พำนัก"
            value={filters.residence}
            onChange={(v) => updateFilter("residence", v)}
            options={filterOptions.residence.map(([v, c]) => ({
              value: v,
              label: `${v} (${c})`,
            }))}
          />
          <FilterSelect
            label="ดิวิชั่น"
            value={filters.division}
            onChange={(v) => updateFilter("division", v)}
            options={filterOptions.division.map(([v, c]) => ({
              value: v,
              label: `${v} (${c})`,
            }))}
          />
          <FilterSelect
            label="ตำแหน่ง"
            value={filters.position}
            onChange={(v) => updateFilter("position", v)}
            options={filterOptions.position.map(([v, c]) => ({
              value: v,
              label: `${v} (${c})`,
            }))}
          />
          <FilterSelect
            label="ใบอนุญาตปัจจุบัน"
            value={filters.currentLicense}
            onChange={(v) => updateFilter("currentLicense", v)}
            options={filterOptions.currentLicense.map(([v, c]) => ({
              value: v,
              label: `${LICENSE_LABEL_MAP[v] ?? v} (${c})`,
            }))}
          />
          <FilterSelect
            label="สถานะ ID AFC"
            value={filters.afcId}
            onChange={(v) => updateFilter("afcId", v as CoachFilters["afcId"])}
            options={[
              { value: "yes", label: "มี ID แล้ว" },
              { value: "no", label: "ยังไม่มี ID" },
            ]}
          />
          <FilterSelect
            label="สถานะใบอนุญาต"
            value={filters.expStatus}
            onChange={(v) => updateFilter("expStatus", v as CoachFilters["expStatus"])}
            options={(Object.keys(LICENSE_STATUS_STYLES) as LicenseStatus[]).map((s) => ({
              value: s,
              label: LICENSE_STATUS_STYLES[s].label,
            }))}
          />
          <FilterSelect
            label="ช่วงอายุ"
            value={filters.ageBucket}
            onChange={(v) => updateFilter("ageBucket", v)}
            options={AGE_BUCKETS.map((b) => ({ value: b.key, label: b.key }))}
          />
          <FilterSelect
            label="ปีที่อบรม"
            value={filters.year}
            onChange={(v) => updateFilter("year", v)}
            options={filterOptions.years.map((y) => ({
              value: String(y),
              label: String(y),
            }))}
          />
          <div className="flex items-end">
            <button
              onClick={() => go({ ...filters, ...EMPTY_FILTER_VALUES })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              ล้างตัวกรอง
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            เคยถือใบอนุญาต (เลือกได้หลายข้อ)
          </span>
          {LICENSE_TYPES.map((t) => (
            <label
              key={t.value}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600"
            >
              <input
                type="checkbox"
                checked={filters.licenseHeld.includes(t.value)}
                onChange={() => toggleLicenseHeld(t.value)}
                className="accent-indigo-600"
              />
              {t.label}
            </label>
          ))}
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
            {filters.gender && (
              <Chip
                text={`เพศ: ${GENDER_LABEL_MAP[filters.gender] ?? filters.gender}`}
                onRemove={() => updateFilter("gender", "")}
              />
            )}
            {filters.nationality && (
              <Chip
                text={`สัญชาติ: ${filters.nationality}`}
                onRemove={() => updateFilter("nationality", "")}
              />
            )}
            {filters.residence && (
              <Chip
                text={`จังหวัด: ${filters.residence}`}
                onRemove={() => updateFilter("residence", "")}
              />
            )}
            {filters.division && (
              <Chip
                text={`ดิวิชั่น: ${filters.division}`}
                onRemove={() => updateFilter("division", "")}
              />
            )}
            {filters.position && (
              <Chip
                text={`ตำแหน่ง: ${filters.position}`}
                onRemove={() => updateFilter("position", "")}
              />
            )}
            {filters.currentLicense && (
              <Chip
                text={`ใบอนุญาต: ${LICENSE_LABEL_MAP[filters.currentLicense] ?? filters.currentLicense}`}
                onRemove={() => updateFilter("currentLicense", "")}
              />
            )}
            {filters.afcId && (
              <Chip
                text={`ID AFC: ${AFC_LABELS[filters.afcId]}`}
                onRemove={() => updateFilter("afcId", "")}
              />
            )}
            {filters.expStatus && (
              <Chip
                text={`สถานะ: ${LICENSE_STATUS_STYLES[filters.expStatus as LicenseStatus].label}`}
                onRemove={() => updateFilter("expStatus", "")}
              />
            )}
            {filters.ageBucket && (
              <Chip
                text={`อายุ: ${filters.ageBucket}`}
                onRemove={() => updateFilter("ageBucket", "")}
              />
            )}
            {filters.year && (
              <Chip text={`ปี: ${filters.year}`} onRemove={() => updateFilter("year", "")} />
            )}
            {filters.licenseHeld.map((t) => (
              <Chip
                key={t}
                text={`ถือ: ${LICENSE_LABEL_MAP[t] ?? t}`}
                onRemove={() => toggleLicenseHeld(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ผลลัพธ์ — จาง (dim) ระหว่างรอข้อมูลใหม่จากตัวกรอง */}
      <div
        className={`space-y-4 transition-opacity duration-200 ${
          isPending ? "opacity-50" : "opacity-100"
        }`}
      >
      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="จำนวนที่แสดง" value={total.toLocaleString()} />
        <KpiCard
          label="มี ID AFC"
          value={`${withAfc.toLocaleString()} / ${(total - withAfc).toLocaleString()}`}
          sub={total ? `${((withAfc / total) * 100).toFixed(1)}% มี ID แล้ว` : ""}
        />
        <KpiCard
          label="สัญชาติไทย / ต่างชาติ"
          value={`${thaiCount.toLocaleString()} / ${(total - thaiCount).toLocaleString()}`}
        />
        <KpiCard
          label="เพศชาย / หญิง"
          value={`${male.toLocaleString()} / ${female.toLocaleString()}`}
        />
      </div>

      {/* กราฟ — ภาพรวมสถานะ */}
      <SectionLabel>ภาพรวมสถานะ</SectionLabel>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ChartCard title="สัดส่วนเพศ">
          <DonutChart
            data={aggregates.genderChart}
            colors={GENDER_COLORS}
            centerLabel="คน"
            emptyMessage="ยังไม่มีข้อมูลเพศสำหรับแสดงกราฟ"
          />
        </ChartCard>
        <ChartCard title="สถานะ ID AFC">
          <DonutChart
            data={aggregates.afcChart}
            colors={AFC_COLORS}
            centerLabel="คน"
            emptyMessage="ยังไม่มีข้อมูลสำหรับแสดงกราฟ"
          />
        </ChartCard>
        <ChartCard title="สถานะใบอนุญาตปัจจุบัน">
          <DonutChart
            data={aggregates.expiryChart}
            colors={STATUS_COLORS}
            centerLabel="คน"
            emptyMessage="ยังไม่มีข้อมูลใบอนุญาตสำหรับแสดงกราฟ"
          />
        </ChartCard>
      </div>

      {/* กราฟ — ใบอนุญาต */}
      <SectionLabel>ใบอนุญาตและการอบรม</SectionLabel>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="ใบอนุญาตปัจจุบัน (แยกตามระดับ)">
          <CategoryBarChart
            data={aggregates.licenseDistChart.map((d) => ({
              name: LICENSE_LABEL_MAP[d.key] ?? d.name,
              value: d.value,
            }))}
            color={CATEGORICAL_PALETTE[0]}
            emptyMessage="ยังไม่มีข้อมูลใบอนุญาตสำหรับแสดงกราฟ"
          />
        </ChartCard>
        <ChartCard title="สถิติการอัปเกรดระดับ (Level Up) ต่อปี">
          <CategoryBarChart
            data={aggregates.levelUpChart}
            color={CATEGORICAL_PALETTE[6]}
            emptyMessage="ยังไม่มีข้อมูลการอัปเกรดระดับสำหรับแสดงกราฟ"
          />
        </ChartCard>
        <ChartCard title="แนวโน้มจำนวนผู้อบรมสำเร็จรายปี แยกตามระดับใบอนุญาต" wide>
          <LicenseTrendChart
            data={aggregates.trend.data}
            licenseTypes={aggregates.trend.licenseTypes}
          />
        </ChartCard>
      </div>

      {/* กราฟ — ข้อมูลประชากร */}
      <SectionLabel>ข้อมูลผู้ฝึกสอน</SectionLabel>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="สัญชาติ (Top 8)">
          <CategoryBarChart
            data={aggregates.nationalityChart}
            color={CATEGORICAL_PALETTE[0]}
            emptyMessage="ยังไม่มีข้อมูลสัญชาติสำหรับแสดงกราฟ"
          />
        </ChartCard>
        <ChartCard title="ช่วงอายุผู้ฝึกสอน">
          <CategoryBarChart
            data={aggregates.ageChart}
            color={CATEGORICAL_PALETTE[2]}
            emptyMessage="ยังไม่มีข้อมูลวันเกิดสำหรับแสดงกราฟ"
          />
        </ChartCard>
        <ChartCard title="จังหวัดที่พำนัก (Top 10)">
          <CategoryBarChart
            data={aggregates.residenceChart}
            color={CATEGORICAL_PALETTE[6]}
            emptyMessage="ยังไม่มีข้อมูลจังหวัดสำหรับแสดงกราฟ"
          />
        </ChartCard>
        <ChartCard title="ดิวิชั่นสังกัด">
          <CategoryBarChart
            data={aggregates.divisionChart}
            color={CATEGORICAL_PALETTE[4]}
            emptyMessage="ยังไม่มีข้อมูลดิวิชั่นสำหรับแสดงกราฟ"
          />
        </ChartCard>
        <ChartCard title="ตำแหน่ง (Top 10)">
          <CategoryBarChart
            data={aggregates.positionChart}
            color={CATEGORICAL_PALETTE[1]}
            emptyMessage="ยังไม่มีข้อมูลตำแหน่งสำหรับแสดงกราฟ"
          />
        </ChartCard>
        <ChartCard title="สโมสรที่มีผู้ฝึกสอนมากที่สุด (Top 10)">
          <CategoryBarChart
            data={aggregates.clubChart}
            color={CATEGORICAL_PALETTE[5]}
            emptyMessage="ยังไม่มีข้อมูลสโมสรสำหรับแสดงกราฟ"
          />
        </ChartCard>
      </div>

      {/* ตารางรายชื่อ */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold text-slate-900">รายชื่อผู้ฝึกสอน (คลิกแถวเพื่อดูรายละเอียด)</h3>
          <span className="text-xs text-slate-400">
            {coachPage.total ? page * PAGE_SIZE + 1 : 0}-
            {Math.min((page + 1) * PAGE_SIZE, coachPage.total)} จาก{" "}
            {coachPage.total.toLocaleString()}
          </span>
        </div>
        {coachPage.rows.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-400">
            ไม่พบผู้ฝึกสอนที่ตรงกับเงื่อนไขที่เลือก
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className="cursor-pointer whitespace-nowrap px-4 py-3 hover:text-slate-900"
                    >
                      {col.label}
                      {sortKey === col.key && (sortAsc ? " ▲" : " ▼")}
                    </th>
                  ))}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coachPage.rows.map((r) => {
                  const status = LICENSE_STATUS_STYLES[r.expStatus];
                  return (
                    <tr
                      key={r.id}
                      onClick={() => router.push(`/coaches/${r.id}`)}
                      className="group cursor-pointer hover:bg-slate-50/60"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">
                        {r.afcId ?? "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-700">
                            {r.name.charAt(0) || "?"}
                          </div>
                          {r.name || <span className="text-slate-400">ไม่ระบุชื่อ</span>}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">
                        {r.gender ? GENDER_LABEL_MAP[r.gender] ?? r.gender : "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">
                        {r.nationality ?? "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">
                        {r.club ?? "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">
                        {r.division ?? "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">
                        {r.position ?? "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">
                        {r.currentLicenseType
                          ? LICENSE_LABEL_MAP[r.currentLicenseType] ?? r.currentLicenseType
                          : "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}
                        >
                          {r.currentExpireDate
                            ? new Date(r.currentExpireDate).toLocaleDateString("th-TH")
                            : status.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right">
                        <ChevronRight className="ml-auto h-4 w-4 text-slate-300 transition-colors group-hover:text-indigo-500" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
          <button
            disabled={page === 0}
            onClick={() => goToPage(page - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            ก่อนหน้า
          </button>
          <span className="text-xs text-slate-400">
            หน้า {page + 1} / {coachPage.pageCount}
          </span>
          <button
            disabled={page >= coachPage.pageCount - 1}
            onClick={() => goToPage(page + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40"
          >
            ถัดไป
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

const EMPTY_FILTER_VALUES: CoachFilters = {
  gender: "",
  nationality: "",
  residence: "",
  division: "",
  position: "",
  currentLicense: "",
  afcId: "",
  expStatus: "",
  ageBucket: "",
  year: "",
  licenseHeld: [],
  search: "",
};

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      >
        <option value="">ทั้งหมด</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Chip({ text, onRemove }: { text: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
      {text}
      <button onClick={onRemove} className="text-indigo-400 hover:text-indigo-700">
        ×
      </button>
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="pt-2 text-xs font-bold uppercase tracking-wide text-slate-400">
      {children}
    </h3>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function ChartCard({
  title,
  wide,
  children,
}: {
  title: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${wide ? "lg:col-span-2" : ""}`}
    >
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}
