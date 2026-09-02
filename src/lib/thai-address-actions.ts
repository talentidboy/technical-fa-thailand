"use server";

import { getDistrictOptions, getSubdistrictOptions } from "@/lib/thai-address";

export async function fetchDistrictOptions(provinceCode: string) {
  return getDistrictOptions(provinceCode);
}

export async function fetchSubdistrictOptions(districtCode: string) {
  return getSubdistrictOptions(districtCode);
}
