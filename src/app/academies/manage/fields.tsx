import type { Academy, AcademyLicence } from "@/generated/prisma/client";
import { ACADEMY_LEVELS, LEVEL_META, bangkokDay } from "@/lib/academy";
import { input } from "@/components/academy/ManageUi";

// ช่องกรอกที่ใช้ร่วมกันระหว่างฟอร์มเพิ่ม/แก้ไขอคาเดมีและใบอนุญาต

export const inputClass = input;

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

// ช่องข้อมูลใบอนุญาต: ใบแรกตอนเพิ่มอคาเดมี และแก้รายละเอียดที่บันทึกผิด (สถานะเปลี่ยนผ่านคำสั่งในแท็บใบอนุญาตเท่านั้น)
export function LicenceFields({ licence }: { licence?: AcademyLicence }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">ระดับ</span>
        <select name="level" defaultValue={licence?.level ?? ""} className={inputClass}>
          <option value="">ยังไม่ระบุระดับ</option>
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
      <Text label="เลขที่ใบอนุญาต" name="licenceNo" defaultValue={licence?.licenceNo} placeholder={licence ? undefined : "เว้นว่าง = ออกเลขอัตโนมัติ"} />
      <Text label="หมายเหตุของใบอนุญาต" name="licenceNote" defaultValue={licence?.note} />
    </div>
  );
}
