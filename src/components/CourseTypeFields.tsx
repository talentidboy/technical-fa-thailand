"use client";

import { useState } from "react";
import { SelectField } from "./FormField";
import { COURSE_TYPES } from "@/lib/constants";

// สลับ dropdown ระดับใบอนุญาตให้ซ่อนไปเมื่อเลือกประเภทหลักสูตรเป็น "อบรมทั่วไป" (ไม่ผูกกับระดับใบอนุญาตใด)
export function CourseTypeFields({ licenseOptions }: { licenseOptions: { value: string; label: string }[] }) {
  const [courseType, setCourseType] = useState<"LICENSE" | "GENERAL">("LICENSE");

  return (
    <>
      <SelectField
        label="ประเภทหลักสูตร"
        name="courseType"
        options={COURSE_TYPES}
        required
        defaultValue="LICENSE"
        onChange={(e) => setCourseType(e.target.value === "GENERAL" ? "GENERAL" : "LICENSE")}
      />
      {courseType === "LICENSE" && (
        <SelectField label="ระดับใบอนุญาต" name="licenseType" options={licenseOptions} required />
      )}
    </>
  );
}
