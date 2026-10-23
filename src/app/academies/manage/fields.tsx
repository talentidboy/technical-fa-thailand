import type { Academy, AcademyLicence } from "@/generated/prisma/client";
import { ACADEMY_LEVELS, LEVEL_META, LICENCE_STATUS, bangkokDay } from "@/lib/academy";

// ช่องกรอกที่ใช้ร่วมกันระหว่างฟอร์มเพิ่ม/แก้ไขอคาเดมีและใบอนุญาต

export const inputClass =
  "rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

function Text({
  label,
  name,
  defaultValue,
  required,
  type = "text",
  placeholder,
  list,
  wide,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  type?: string;
  placeholder?: string;
  list?: string;
  wide?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input name={name} type={type} required={required} defaultValue={defaultValue ?? ""} placeholder={placeholder} list={list} className={inputClass} />
    </label>
  );
}

export function AcademyFields({ academy, provinces }: { academy?: Academy; provinces: string[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Text label="ชื่ออคาเดมี (อังกฤษ)" name="nameEn" required defaultValue={academy?.nameEn} placeholder="Buriram United Academy" />
      <Text label="ชื่ออคาเดมี (ไทย)" name="nameTh" defaultValue={academy?.nameTh} placeholder="บุรีรัมย์ ยูไนเต็ด อคาเดมี" />
      <Text label="ชื่อเดิม / ชื่อเรียกอื่น" name="aliases" defaultValue={academy?.aliases} wide />
      <Text label="จังหวัด" name="province" defaultValue={academy?.province} list="academy-provinces" placeholder="พิมพ์หรือเลือกจังหวัด" />
      <datalist id="academy-provinces">
        {provinces.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <Text label="สโมสรต้นสังกัด" name="parentClub" defaultValue={academy?.parentClub} />
      <Text label="ที่อยู่ / สนามฝึก" name="address" defaultValue={academy?.address} wide />
      <Text label="ผู้ประสานงาน" name="contactName" defaultValue={academy?.contactName} />
      <Text label="เบอร์โทรศัพท์" name="phone" type="tel" defaultValue={academy?.phone} />
      <Text label="อีเมล" name="email" type="email" defaultValue={academy?.email} />
      <Text label="เว็บไซต์ / เพจ" name="website" type="url" defaultValue={academy?.website} placeholder="https://..." />
      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-sm font-medium text-slate-700">หมายเหตุ (ภายใน)</span>
        <textarea name="note" rows={2} defaultValue={academy?.note ?? ""} className={inputClass} />
      </label>
    </div>
  );
}

// requireLevel = ออกใบใหม่ (ต่ออายุ / เลื่อนระดับ) ต้องเลือกระดับ · ใบแรกตอนเพิ่มอคาเดมี / แก้ไขใบเดิม เว้นว่างได้
export function LicenceFields({ licence, withStatus, requireLevel }: { licence?: AcademyLicence; withStatus?: boolean; requireLevel?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">
          ระดับ{requireLevel && <span className="text-red-500"> *</span>}
        </span>
        <select name="level" required={requireLevel} defaultValue={licence?.level ?? ""} className={inputClass}>
          <option value="" disabled={requireLevel}>
            {requireLevel ? "เลือกระดับ" : "ยังไม่ระบุระดับ"}
          </option>
          {ACADEMY_LEVELS.map((l) => (
            <option key={l} value={l}>
              FAT {LEVEL_META[l].label} ({LEVEL_META[l].th})
            </option>
          ))}
        </select>
      </label>
      <Text label="ลีกของสโมสร" name="tier" defaultValue={licence?.tier} placeholder="T1 / T2 / T3" />
      <Text label="วันที่อนุมัติ" name="approvedAt" type="date" defaultValue={licence?.approvedAt ? bangkokDay(licence.approvedAt) : undefined} />
      <Text label="วันหมดอายุ" name="expiresAt" type="date" defaultValue={licence?.expiresAt ? bangkokDay(licence.expiresAt) : undefined} />
      <Text label="เลขที่ใบอนุญาต" name="licenceNo" defaultValue={licence?.licenceNo} />
      {withStatus && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">สถานะ</span>
          <select name="status" defaultValue={licence?.status ?? "ACTIVE"} className={inputClass}>
            {Object.entries(LICENCE_STATUS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-sm font-medium text-slate-700">หมายเหตุของใบอนุญาต</span>
        <input name="licenceNote" defaultValue={licence?.note ?? ""} className={inputClass} />
      </label>
    </div>
  );
}
