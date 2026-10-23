import { NextResponse, type NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { requireUser } from "@/lib/auth";
import { LEVEL_META, LICENCE_STATUS, STATE_META, compareAcademies, isLevel, thaiDate, tierLabel, type AcademyState } from "@/lib/academy";
import { loadAcademies, matchesQuery } from "@/lib/academy-data";
import { ISSUES, type IssueKey } from "@/lib/academy-issues";

const HEAD_FONT = { bold: true, color: { argb: "FF3730A3" } } as const;
const HEAD_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF2FF" } } as const;
const levelText = (l: string | null) => (isLevel(l) ? LEVEL_META[l].label : "ยังไม่ระบุ");

// ส่งออกทะเบียนอคาเดมีเป็น Excel (ตามตัวกรองในหน้าจัดการ) — มีข้อมูลติดต่อ จึงให้เฉพาะแอดมิน/เจ้าหน้าที่
export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "STAFF") return new NextResponse("Forbidden", { status: 403 });

  const sp = request.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const level = sp.get("level");
  const state = sp.get("state");
  const province = sp.get("province");
  const issue = (sp.get("issue") ?? "") in ISSUES ? (sp.get("issue") as IssueKey) : null;
  const now = new Date();
  const rows = (await loadAcademies(now))
    .filter(
      (a) =>
        (!level || (level === "PENDING" ? a.state === "pending" : a.level === level)) &&
        (!state || (state === "inactive" ? !a.active : a.state === state)) &&
        (!province || a.province === province) &&
        (!issue || ISSUES[issue].test(a)) &&
        matchesQuery(a, q),
    )
    .sort(compareAcademies);

  const wb = new ExcelJS.Workbook();
  wb.creator = "FA Thailand Technical";

  const s = wb.addWorksheet("ทะเบียนอคาเดมี", { views: [{ state: "frozen", ySplit: 1 }] });
  s.columns = [
    { header: "ลำดับ", width: 7 },
    { header: "ระดับ", width: 10 },
    { header: "ลีกของสโมสร", width: 11 },
    { header: "Academy", width: 36 },
    { header: "อคาเดมี", width: 36 },
    { header: "จังหวัด", width: 16 },
    { header: "สโมสรต้นสังกัด", width: 20 },
    { header: "ผู้ประสานงาน", width: 18 },
    { header: "เบอร์โทรศัพท์", width: 15 },
    { header: "อีเมล", width: 30 },
    { header: "วันที่อนุมัติ", width: 14 },
    { header: "วันหมดอายุ", width: 14 },
    { header: "สถานะ", width: 14 },
    { header: "เลขที่ใบอนุญาต", width: 16 },
    { header: "แสดงบนหน้าสาธารณะ", width: 12 },
    { header: "หมายเหตุ", width: 30 },
  ];
  s.getRow(1).font = HEAD_FONT;
  s.getRow(1).fill = HEAD_FILL;
  rows.forEach((a, i) =>
    s.addRow([
      i + 1,
      levelText(a.level),
      tierLabel(a.current?.tier) ?? "",
      a.nameEn,
      a.nameTh ?? "",
      a.province ?? "",
      a.parentClub ?? "",
      a.contactName ?? "",
      a.phone ?? "",
      a.email ?? "",
      a.current?.approvedAt ? thaiDate(a.current.approvedAt) : "",
      a.current?.expiresAt ? thaiDate(a.current.expiresAt) : "",
      STATE_META[a.state as AcademyState].label,
      a.current?.licenceNo ?? "",
      a.active ? "แสดง" : "ปิด",
      [a.note, a.current?.note].filter(Boolean).join(" · "),
    ]),
  );

  const h = wb.addWorksheet("ประวัติใบอนุญาต", { views: [{ state: "frozen", ySplit: 1 }] });
  h.columns = [
    { header: "Academy", width: 36 },
    { header: "ระดับ", width: 10 },
    { header: "ลีกของสโมสร", width: 11 },
    { header: "วันที่อนุมัติ", width: 14 },
    { header: "วันหมดอายุ", width: 14 },
    { header: "สถานะ", width: 22 },
    { header: "เลขที่ใบอนุญาต", width: 16 },
    { header: "ลำดับในทะเบียนเดิม", width: 12 },
    { header: "หมายเหตุ", width: 30 },
  ];
  h.getRow(1).font = HEAD_FONT;
  h.getRow(1).fill = HEAD_FILL;
  for (const a of rows)
    for (const l of a.licences)
      h.addRow([
        a.nameEn,
        levelText(l.level),
        tierLabel(l.tier) ?? "",
        l.approvedAt ? thaiDate(l.approvedAt) : "",
        l.expiresAt ? thaiDate(l.expiresAt) : "",
        LICENCE_STATUS[l.status] ?? l.status,
        l.licenceNo ?? "",
        l.registryNo ?? "",
        l.note ?? "",
      ]);

  const stamp = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(now);
  return new NextResponse(new Uint8Array(await wb.xlsx.writeBuffer()), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="academy-licensing-${stamp}.xlsx"`,
    },
  });
}
