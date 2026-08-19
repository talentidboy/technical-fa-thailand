import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

const COLUMNS = [
  "nameTh",
  "surnameTh",
  "nameEn",
  "familyNameEn",
  "gender",
  "dob",
  "nationality",
  "residence",
  "afcId",
  "idNumber",
  "passportNumber",
  "email",
  "telNo",
];

export async function GET() {
  await requireAdmin();

  const csv = COLUMNS.join(",") + "\n";
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=coach-import-template.csv",
    },
  });
}
