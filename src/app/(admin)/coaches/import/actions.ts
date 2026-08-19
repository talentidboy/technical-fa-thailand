"use server";

import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function clean(value: unknown) {
  const str = String(value ?? "").trim();
  return str || null;
}

export async function importCoachesCsv(formData: FormData) {
  await requireAdmin();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    throw new Error("กรุณาเลือกไฟล์ CSV");
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = parsed.data.filter((row) => row.nameTh && row.surnameTh);
  if (rows.length === 0) {
    throw new Error(
      "ไม่พบข้อมูลที่ถูกต้องในไฟล์ — ต้องมีอย่างน้อยคอลัมน์ nameTh และ surnameTh",
    );
  }

  const existingAfcIds = new Set(
    (
      await prisma.coach.findMany({
        where: { afcId: { not: null } },
        select: { afcId: true },
      })
    ).map((c) => c.afcId),
  );

  const newRows = rows.filter((row) => {
    const afcId = clean(row.afcId);
    return !afcId || !existingAfcIds.has(afcId);
  });

  await prisma.coach.createMany({
    data: newRows.map((row) => ({
      nameTh: String(row.nameTh).trim(),
      surnameTh: String(row.surnameTh).trim(),
      nameEn: clean(row.nameEn),
      familyNameEn: clean(row.familyNameEn),
      gender: clean(row.gender),
      dob: row.dob ? new Date(row.dob) : null,
      nationality: clean(row.nationality),
      residence: clean(row.residence),
      afcId: clean(row.afcId),
      idNumber: clean(row.idNumber),
      passportNumber: clean(row.passportNumber),
      email: clean(row.email),
      telNo: clean(row.telNo),
    })),
  });

  revalidatePath("/coaches");
  revalidatePath("/dashboard");

  redirect(
    `/coaches?imported=${newRows.length}&skipped=${rows.length - newRows.length}`,
  );
}
