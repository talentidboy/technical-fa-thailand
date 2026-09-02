import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createCoach } from "./actions";
import { importCoachesCsv } from "./import/actions";
import { getCurrentUser } from "@/lib/auth";
import {
  Users,
  Search,
  ChevronRight,
  ChevronLeft,
  Download,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { SelectField } from "@/components/FormField";
import { AddCoachModal } from "@/components/AddCoachModal";
import {
  LICENSE_TYPES,
  RECORD_TYPES,
  LICENSE_STATUS_OPTIONS,
} from "@/lib/constants";
import { buildCoachWhere, getDistinctResidences } from "@/lib/coach-filters";
import { getCountryOptions, getFlagEmoji } from "@/lib/countries";
import { getProvinceOptions } from "@/lib/thai-address";

const PAGE_SIZE = 50;

type SearchParams = {
  q?: string;
  licenseType?: string;
  recordType?: string;
  residence?: string;
  status?: string;
  imported?: string;
  skipped?: string;
  page?: string;
  new?: string;
};

export default async function CoachesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  const page = Math.max(0, Number(params.page ?? 0) || 0);
  const where = buildCoachWhere(params);
  const [coaches, total, residences] = await Promise.all([
    prisma.coach.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { licenseRecords: true } } },
      take: PAGE_SIZE,
      skip: page * PAGE_SIZE,
    }),
    prisma.coach.count({ where }),
    getDistinctResidences(),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);

  const pageQuery = (p: number) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(
        ([k, v]) =>
          v && ["q", "licenseType", "recordType", "residence", "status"].includes(k),
      ) as [string, string][],
    );
    if (p > 0) q.set("page", String(p));
    const qs = q.toString();
    return qs ? `/coaches?${qs}` : "/coaches";
  };

  const hasFilters = Boolean(
    params.q ||
      params.licenseType ||
      params.recordType ||
      params.residence ||
      params.status,
  );

  const exportQuery = new URLSearchParams(
    Object.entries(params).filter(([k]) =>
      ["q", "licenseType", "recordType", "residence", "status"].includes(k),
    ) as [string, string][],
  ).toString();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            รายชื่อผู้ฝึกสอน
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            จัดการข้อมูลประจำตัวผู้ฝึกสอนทั้งหมดในระบบ
          </p>
        </div>
        {isAdmin && (
          <AddCoachModal
            action={createCoach}
            autoOpen={params.new !== undefined}
            countryOptions={getCountryOptions().map((c) => ({
              value: c.code,
              label: `${getFlagEmoji(c.code) ?? ""} ${c.nameTh}`.trim(),
            }))}
            provinces={getProvinceOptions()}
          />
        )}
      </div>

      {params.imported !== undefined && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          นำเข้าข้อมูลสำเร็จ {params.imported} รายการ
          {Number(params.skipped) > 0 &&
            ` (ข้าม ${params.skipped} รายการที่มี AFC ID ซ้ำ)`}
        </div>
      )}

      {isAdmin && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Upload className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">
              นำเข้าข้อมูลจากไฟล์ CSV
            </h2>
          </div>
          <form
            action={importCoachesCsv}
            className="flex flex-wrap items-end gap-4 p-6"
          >
            <input
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-amber-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-amber-600"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-amber-200 transition-colors hover:bg-amber-600"
            >
              <Upload className="h-4 w-4" />
              นำเข้าข้อมูล
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download endpoint, not a page route */}
            <a
              href="/coaches/import/template"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              <Download className="h-3.5 w-3.5" />
              ดาวน์โหลดเทมเพลต CSV
            </a>
          </form>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={params.q}
              placeholder="ค้นหาชื่อ, AFC ID, จังหวัด..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SelectField
              label="ระดับใบอนุญาต"
              name="licenseType"
              options={LICENSE_TYPES}
              defaultValue={params.licenseType}
            />
            <SelectField
              label="ประเภทการได้มา"
              name="recordType"
              options={RECORD_TYPES}
              defaultValue={params.recordType}
            />
            <SelectField
              label="จังหวัด"
              name="residence"
              options={residences.map((r) => ({ value: r, label: r }))}
              defaultValue={params.residence}
            />
            <SelectField
              label="สถานะใบอนุญาต"
              name="status"
              options={LICENSE_STATUS_OPTIONS}
              defaultValue={params.status}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              กรองข้อมูล
            </button>
            {hasFilters && (
              <Link
                href="/coaches"
                className="text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                ล้างตัวกรอง
              </Link>
            )}
            <a
              href={`/coaches/export${exportQuery ? `?${exportQuery}` : ""}`}
              className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <FileSpreadsheet className="h-4 w-4" />
              ส่งออก Excel
            </a>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {total > 0 && (
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3 text-xs text-slate-400">
            <span>
              {safePage * PAGE_SIZE + 1}-{Math.min((safePage + 1) * PAGE_SIZE, total)} จาก{" "}
              {total.toLocaleString()} คน
            </span>
          </div>
        )}
        {coaches.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-sm text-slate-500">
              {hasFilters
                ? "ไม่พบผู้ฝึกสอนที่ตรงกับเงื่อนไขที่เลือก"
                : "ยังไม่มีข้อมูลผู้ฝึกสอน — เริ่มเพิ่มข้อมูลแรกของคุณได้เลย"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">ชื่อ-นามสกุล</th>
                  <th className="px-6 py-3.5">AFC ID</th>
                  <th className="px-6 py-3.5">ติดต่อ</th>
                  <th className="px-6 py-3.5">พำนัก</th>
                  <th className="px-6 py-3.5">ใบอนุญาต</th>
                  <th className="px-6 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coaches.map((coach) => (
                  <tr
                    key={coach.id}
                    className="transition-colors hover:bg-slate-50/60"
                  >
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/coaches/${coach.id}`}
                        className="flex items-center gap-3"
                      >
                        {coach.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={coach.photoUrl}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                            {coach.nameTh.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium text-slate-900 hover:text-indigo-600">
                          {coach.nameTh} {coach.surnameTh}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {coach.afcId ?? (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {coach.email ?? coach.telNo ?? (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {coach.residence ?? (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {coach._count.licenseRecords}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        href={`/coaches/${coach.id}`}
                        aria-label="ดูรายละเอียด"
                        className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
            <Link
              href={pageQuery(safePage - 1)}
              aria-disabled={safePage === 0}
              className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 ${
                safePage === 0 ? "pointer-events-none opacity-40" : "hover:bg-slate-50"
              }`}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              ก่อนหน้า
            </Link>
            <span className="text-xs text-slate-400">
              หน้า {safePage + 1} / {pageCount}
            </span>
            <Link
              href={pageQuery(safePage + 1)}
              aria-disabled={safePage >= pageCount - 1}
              className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 ${
                safePage >= pageCount - 1
                  ? "pointer-events-none opacity-40"
                  : "hover:bg-slate-50"
              }`}
            >
              ถัดไป
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
