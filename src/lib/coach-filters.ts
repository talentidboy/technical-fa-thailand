import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";

export type CoachSearchParams = {
  q?: string;
  licenseType?: string;
  recordType?: string;
  residence?: string;
  status?: string;
};

export function buildCoachWhere(
  params: CoachSearchParams,
): Prisma.CoachWhereInput {
  const where: Prisma.CoachWhereInput = {};
  const and: Prisma.CoachWhereInput[] = [];

  const query = params.q?.trim();
  if (query) {
    and.push({
      OR: [
        { nameTh: { contains: query } },
        { surnameTh: { contains: query } },
        { nameEn: { contains: query } },
        { familyNameEn: { contains: query } },
        { afcId: { contains: query } },
        { residence: { contains: query } },
      ],
    });
  }

  if (params.residence) {
    and.push({ residence: params.residence });
  }

  const licenseSome: Prisma.LicenseRecordWhereInput = {};
  let hasLicenseFilter = false;

  if (params.licenseType) {
    licenseSome.licenseType = params.licenseType;
    hasLicenseFilter = true;
  }
  if (params.recordType) {
    licenseSome.recordType = params.recordType;
    hasLicenseFilter = true;
  }
  if (params.status === "ACTIVE") {
    licenseSome.OR = [{ expireDate: null }, { expireDate: { gte: new Date() } }];
    hasLicenseFilter = true;
  } else if (params.status === "EXPIRED") {
    licenseSome.expireDate = { lt: new Date() };
    hasLicenseFilter = true;
  }

  if (hasLicenseFilter) {
    and.push({ licenseRecords: { some: licenseSome } });
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return where;
}

export async function getDistinctResidences() {
  const rows = await prisma.coach.findMany({
    where: { residence: { not: null } },
    select: { residence: true },
    distinct: ["residence"],
    orderBy: { residence: "asc" },
  });
  return rows.map((r) => r.residence!).filter(Boolean);
}
