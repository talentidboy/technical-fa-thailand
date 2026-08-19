import { CoachReportDashboard } from "@/components/CoachReportDashboard";
import {
  getCoachPage,
  getCoachAggregates,
  getFilterOptions,
  EMPTY_FILTERS,
  type CoachFilters,
  type SortKey,
} from "@/lib/coach-query";

type ReportSearchParams = {
  gender?: string;
  nationality?: string;
  residence?: string;
  division?: string;
  position?: string;
  license?: string;
  afc?: string;
  exp?: string;
  age?: string;
  year?: string;
  held?: string;
  q?: string;
  sort?: string;
  dir?: string;
  page?: string;
};

function parseFilters(params: ReportSearchParams): CoachFilters {
  return {
    ...EMPTY_FILTERS,
    gender: params.gender ?? "",
    nationality: params.nationality ?? "",
    residence: params.residence ?? "",
    division: params.division ?? "",
    position: params.position ?? "",
    currentLicense: params.license ?? "",
    afcId: (params.afc as CoachFilters["afcId"]) ?? "",
    expStatus: (params.exp as CoachFilters["expStatus"]) ?? "",
    ageBucket: params.age ?? "",
    year: params.year ?? "",
    licenseHeld: params.held ? params.held.split(",").filter(Boolean) : [],
    search: params.q ?? "",
  };
}

export default async function DashboardReportPage({
  searchParams,
}: {
  searchParams: Promise<ReportSearchParams>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const sortKey = (params.sort as SortKey) ?? "name";
  const sortAsc = params.dir !== "desc";
  const page = Math.max(0, Number(params.page ?? 0) || 0);

  const [coachPage, aggregates, filterOptions] = await Promise.all([
    getCoachPage(filters, sortKey, sortAsc, page),
    getCoachAggregates(filters),
    getFilterOptions(),
  ]);

  return (
    <div className="space-y-6">
      <CoachReportDashboard
        filters={filters}
        sortKey={sortKey}
        sortAsc={sortAsc}
        page={page}
        coachPage={coachPage}
        aggregates={aggregates}
        filterOptions={filterOptions}
      />
    </div>
  );
}
