"use client";

import { useState, useTransition } from "react";
import { fetchDistrictOptions, fetchSubdistrictOptions } from "@/lib/thai-address-actions";
import type { AddressOption, SubdistrictOption } from "@/lib/thai-address";

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400";

export function ThaiAddressFields({
  provinces,
  initialProvinceCode = "",
  initialDistrictCode = "",
  initialSubdistrictCode = "",
  initialDistricts = [],
  initialSubdistricts = [],
  legacyResidence,
}: {
  provinces: AddressOption[];
  initialProvinceCode?: string;
  initialDistrictCode?: string;
  initialSubdistrictCode?: string;
  initialDistricts?: AddressOption[];
  initialSubdistricts?: SubdistrictOption[];
  legacyResidence?: string | null;
}) {
  const [provinceCode, setProvinceCode] = useState(initialProvinceCode);
  const [districtCode, setDistrictCode] = useState(initialDistrictCode);
  const [subdistrictCode, setSubdistrictCode] = useState(initialSubdistrictCode);
  const [districts, setDistricts] = useState(initialDistricts);
  const [subdistricts, setSubdistricts] = useState(initialSubdistricts);
  const [, startTransition] = useTransition();

  function onProvinceChange(code: string) {
    setProvinceCode(code);
    setDistrictCode("");
    setSubdistrictCode("");
    setSubdistricts([]);
    setDistricts([]);
    if (code) {
      startTransition(async () => {
        setDistricts(await fetchDistrictOptions(code));
      });
    }
  }

  function onDistrictChange(code: string) {
    setDistrictCode(code);
    setSubdistrictCode("");
    setSubdistricts([]);
    if (code) {
      startTransition(async () => {
        setSubdistricts(await fetchSubdistrictOptions(code));
      });
    }
  }

  const selectedSubdistrict = subdistricts.find((s) => s.code === subdistrictCode);

  return (
    <>
      <input type="hidden" name="provinceCode" value={provinceCode} />
      <input type="hidden" name="districtCode" value={districtCode} />
      <input type="hidden" name="subdistrictCode" value={subdistrictCode} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">จังหวัด</span>
        <select
          value={provinceCode}
          onChange={(e) => onProvinceChange(e.target.value)}
          className={selectClass}
        >
          <option value="">เลือกจังหวัด...</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>
              {p.nameTh}
            </option>
          ))}
        </select>
        {!provinceCode && legacyResidence && (
          <span className="text-xs text-slate-400">ข้อมูลเดิม: {legacyResidence} (ยังไม่ได้ระบุในรูปแบบใหม่)</span>
        )}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">อำเภอ / เขต</span>
        <select
          value={districtCode}
          onChange={(e) => onDistrictChange(e.target.value)}
          disabled={!provinceCode}
          className={selectClass}
        >
          <option value="">เลือกอำเภอ...</option>
          {districts.map((d) => (
            <option key={d.code} value={d.code}>
              {d.nameTh}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">ตำบล / แขวง</span>
        <select
          value={subdistrictCode}
          onChange={(e) => setSubdistrictCode(e.target.value)}
          disabled={!districtCode}
          className={selectClass}
        >
          <option value="">เลือกตำบล...</option>
          {subdistricts.map((s) => (
            <option key={s.code} value={s.code}>
              {s.nameTh}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">รหัสไปรษณีย์</span>
        <input
          readOnly
          value={selectedSubdistrict?.postalCode ?? ""}
          placeholder="เลือกตำบลก่อน"
          className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 placeholder:text-slate-400"
        />
      </label>
    </>
  );
}
