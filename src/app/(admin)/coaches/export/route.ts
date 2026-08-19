import { NextResponse, type NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { buildCoachWhere } from "@/lib/coach-filters";
import { labelFor, GENDER_OPTIONS } from "@/lib/constants";

export async function GET(request: NextRequest) {
  await requireUser();

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const where = buildCoachWhere(params);

  const coaches = await prisma.coach.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      licenseRecords: { orderBy: { issueDate: "desc" } },
      employments: { orderBy: { createdAt: "desc" } },
    },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Coaches");
  sheet.columns = [
    { header: "ชื่อ-นามสกุล (ไทย)", key: "nameTh", width: 28 },
    { header: "ชื่อ-นามสกุล (อังกฤษ)", key: "nameEn", width: 28 },
    { header: "AFC ID", key: "afcId", width: 20 },
    { header: "เพศ", key: "gender", width: 10 },
    { header: "สัญชาติ", key: "nationality", width: 14 },
    { header: "จังหวัดที่พำนัก", key: "residence", width: 18 },
    { header: "อีเมล", key: "email", width: 24 },
    { header: "เบอร์โทร", key: "telNo", width: 16 },
    { header: "ระดับใบอนุญาตล่าสุด", key: "latestLicense", width: 18 },
    { header: "จำนวนใบอนุญาต", key: "licenseCount", width: 14 },
    { header: "สโมสรปัจจุบัน", key: "currentClub", width: 24 },
  ];
  sheet.getRow(1).font = { bold: true, color: { argb: "FF3730A3" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEEF2FF" },
  };

  for (const coach of coaches) {
    sheet.addRow({
      nameTh: `${coach.nameTh} ${coach.surnameTh}`,
      nameEn: [coach.nameEn, coach.familyNameEn].filter(Boolean).join(" "),
      afcId: coach.afcId ?? "",
      gender: labelFor(GENDER_OPTIONS, coach.gender) ?? "",
      nationality: coach.nationality ?? "",
      residence: coach.residence ?? "",
      email: coach.email ?? "",
      telNo: coach.telNo ?? "",
      latestLicense: coach.licenseRecords[0]?.licenseType ?? "",
      licenseCount: coach.licenseRecords.length,
      currentClub: coach.employments[0]?.clubName ?? "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=coaches-${new Date().toISOString().slice(0, 10)}.xlsx`,
    },
  });
}
