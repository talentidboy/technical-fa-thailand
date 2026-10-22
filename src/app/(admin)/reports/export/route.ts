import { NextResponse, type NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { requireUser } from "@/lib/auth";
import { loadTrainingReport, parseYearRange, thaiYear, REPORT_LEVELS, LEVEL_LABEL } from "@/lib/training-report";

const HEAD_FONT = { bold: true, color: { argb: "FF3730A3" } } as const;
const HEAD_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF2FF" } } as const;
const TOTAL_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } } as const;

function styleHeader(row: ExcelJS.Row) {
  row.font = HEAD_FONT;
  row.fill = HEAD_FILL;
}
const thaiDate = (d: Date | null) =>
  d ? d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" }) : "";

// ไฟล์ Excel รายงานสรุปการอบรม — หลายชีต: สรุป, ตามปี, ภูมิภาค, เพศ, รุ่นอบรม, รายชื่อผู้ได้รับใบอนุญาต, ข้อมูลควรตรวจสอบ
export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (user.role === "COACH") return new NextResponse("Forbidden", { status: 403 });

  const now = new Date();
  const sp = request.nextUrl.searchParams;
  const { fromYear, toYear } = parseYearRange(sp.get("from") ?? undefined, sp.get("to") ?? undefined, thaiYear(now));
  const r = await loadTrainingReport(fromYear, toYear, now);
  const range = fromYear === toYear ? `${fromYear + 543}` : `${fromYear + 543}-${toYear + 543}`;

  const wb = new ExcelJS.Workbook();
  wb.creator = "FA Thailand Technical";

  // ===== สรุป =====
  const s = wb.addWorksheet("สรุป");
  s.columns = [{ width: 34 }, { width: 16 }];
  s.addRow([`รายงานสรุปการอบรมผู้ฝึกสอน ปี พ.ศ. ${range} (ค.ศ. ${fromYear}${fromYear === toYear ? "" : `-${toYear}`})`]).font = { bold: true, size: 14 };
  s.addRow([`ออกรายงานเมื่อ ${thaiDate(now)} · FA Thailand Technical Department`]).font = { color: { argb: "FF64748B" } };
  s.addRow([]);
  styleHeader(s.addRow(["ตัวชี้วัด", "จำนวน"]));
  for (const [label, value] of [
    ["ใบอนุญาตที่ออก", r.kpi.issued],
    ["ผู้ฝึกสอนที่ได้รับใบอนุญาต (คน)", r.kpi.coaches],
    ["ผู้ฝึกสอนใหม่ (ได้รับใบแรก)", r.kpi.newCoaches],
    ["อัปเกรดระดับ", r.kpi.upgrades],
    ["ต่ออายุใบอนุญาต", r.kpi.renewals],
    ["ข้อมูลที่ควรตรวจสอบ (ไม่นับรวม)", r.issues.length],
  ] as const)
    s.addRow([label, value]);
  s.addRow([]);
  styleHeader(s.addRow(["ระดับ", "ใบอนุญาตที่ออก"]));
  for (const l of REPORT_LEVELS) s.addRow([LEVEL_LABEL[l], r.levelTotals[l]]);

  // ตารางระดับ (แถว = ปี / ภูมิภาค / เพศ)
  const levelSheet = (name: string, head: string, rows: { label: string; counts: Record<string, number>; total: number }[]) => {
    const ws = wb.addWorksheet(name);
    ws.columns = [{ width: 26 }, ...REPORT_LEVELS.map(() => ({ width: 9 })), { width: 10 }];
    styleHeader(ws.addRow([head, ...REPORT_LEVELS.map((l) => LEVEL_LABEL[l]), "รวม"]));
    for (const row of rows) ws.addRow([row.label, ...REPORT_LEVELS.map((l) => row.counts[l]), row.total]);
    const totals = REPORT_LEVELS.map((l) => rows.reduce((t, x) => t + x.counts[l], 0));
    const tr = ws.addRow(["รวม", ...totals, totals.reduce((a, b) => a + b, 0)]);
    tr.font = { bold: true };
    tr.fill = TOTAL_FILL;
    ws.views = [{ state: "frozen", ySplit: 1 }];
  };
  levelSheet("ตามปีและระดับ", "ปี พ.ศ. (ค.ศ.)", r.byYear.map((y) => ({ label: `${y.year + 543} (${y.year})`, counts: y.counts, total: y.total })));
  levelSheet("ตามภูมิภาค", "ภูมิภาค", r.byRegion);
  levelSheet("ตามเพศ", "เพศ", r.byGender);

  // ===== รุ่นอบรม =====
  const ss = wb.addWorksheet("รุ่นอบรม");
  ss.columns = [
    { header: "หลักสูตร", width: 28 },
    { header: "รุ่น", width: 20 },
    { header: "สถานที่", width: 22 },
    { header: "เริ่ม", width: 14 },
    { header: "สิ้นสุด", width: 14 },
    { header: "สมัคร", width: 9 },
    { header: "เข้าอบรม", width: 10 },
    { header: "ผ่าน", width: 9 },
    { header: "ไม่ผ่าน", width: 9 },
    { header: "อัตราผ่าน", width: 10 },
  ];
  styleHeader(ss.getRow(1));
  for (const x of r.sessions)
    ss.addRow([x.title, x.name, x.venue ?? "", thaiDate(x.startDate), thaiDate(x.endDate), x.applicants, x.approved, x.passed, x.failed, x.passRate == null ? "" : x.passRate]);
  ss.getColumn(10).numFmt = "0%";

  // ===== รายชื่อผู้ได้รับใบอนุญาต =====
  const ls = wb.addWorksheet("รายชื่อผู้ได้รับใบอนุญาต");
  ls.columns = [
    { header: "ลำดับ", width: 7 },
    { header: "เลขที่ใบอนุญาต", width: 16 },
    { header: "ระดับ", width: 8 },
    { header: "วันที่ออก", width: 14 },
    { header: "วันหมดอายุ", width: 14 },
    { header: "ชื่อ-นามสกุล (ไทย)", width: 28 },
    { header: "Name (English)", width: 28 },
    { header: "AFC ID", width: 16 },
    { header: "เพศ", width: 8 },
    { header: "จังหวัด", width: 16 },
    { header: "ภูมิภาค", width: 20 },
    { header: "หมายเหตุ", width: 14 },
  ];
  styleHeader(ls.getRow(1));
  r.records.forEach((x, i) =>
    ls.addRow([i + 1, x.certificateNo ?? "", x.licenseType, thaiDate(x.issueDate), thaiDate(x.expireDate), x.nameTh, x.nameEn, x.afcId ?? "", x.gender, x.province, x.region, x.kind]),
  );
  ls.views = [{ state: "frozen", ySplit: 1 }];
  ls.autoFilter = { from: "A1", to: "L1" };

  // ===== ข้อมูลที่ควรตรวจสอบ =====
  if (r.issues.length > 0) {
    const is = wb.addWorksheet("ข้อมูลควรตรวจสอบ");
    is.columns = [
      { header: "ชื่อ-นามสกุล", width: 28 },
      { header: "ระดับ", width: 8 },
      { header: "เลขที่ใบอนุญาต", width: 16 },
      { header: "วันที่ออก (ในระบบ)", width: 18 },
      { header: "ปัญหา", width: 40 },
    ];
    styleHeader(is.getRow(1));
    for (const x of r.issues) is.addRow([x.coachName, x.licenseType, x.certificateNo ?? "", x.issueDate ? x.issueDate.toISOString().slice(0, 10) : "", x.problem]);
  }

  if (r.duplicates.length > 0) {
    const ds = wb.addWorksheet("อาจซ้ำกัน");
    ds.columns = [
      { header: "ชื่อ-นามสกุล", width: 28 },
      { header: "รหัสในระบบ", width: 12 },
      { header: "AFC ID", width: 18 },
      { header: "มีเลขบัตร", width: 10 },
      { header: "จำนวนใบอนุญาต", width: 14 },
    ];
    styleHeader(ds.getRow(1));
    for (const d of r.duplicates) for (const c of d.coaches) ds.addRow([d.name, c.id, c.afcId ?? "", c.hasIdNumber ? "มี" : "ไม่มี", c.licenses]);
  }

  if (r.completeness.incomplete.length > 0) {
    const cs = wb.addWorksheet("ข้อมูลไม่ครบ");
    cs.columns = [
      { header: "รหัสในระบบ", width: 12 },
      { header: "ชื่อ-นามสกุล", width: 30 },
      { header: "AFC ID", width: 18 },
      { header: "ครบ (%)", width: 9 },
      { header: "ข้อมูลที่ยังขาด", width: 70 },
    ];
    styleHeader(cs.getRow(1));
    for (const c of r.completeness.incomplete) cs.addRow([c.id, c.name, c.afcId ?? "", c.percent, c.missing.join(", ")]);
    cs.views = [{ state: "frozen", ySplit: 1 }];
    cs.autoFilter = { from: "A1", to: "E1" };
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=training-report-${fromYear}-${toYear}.xlsx`,
    },
  });
}
