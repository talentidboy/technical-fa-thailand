import { ACADEMY_LEVELS, ISSUE_KINDS, LEVEL_META, bangkokDay, isLevel } from "@/lib/academy";
import { ResultForm } from "@/components/ResultForm";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { issueLicence, revokeLicence } from "@/app/academies/manage/actions";
import { btn, input } from "./ManageUi";

const label = "flex flex-col gap-1.5 text-sm font-medium text-slate-700";
const SUBMIT: Record<keyof typeof ISSUE_KINDS, string> = { NEW: "ออกใบอนุญาต", RENEW: "ยืนยันต่ออายุ", CHANGE: "ยืนยันเปลี่ยนระดับ" };

// ออกใบใหม่ / ต่ออายุ / เปลี่ยนระดับ — สองแบบหลังแทนที่ใบเดิมให้อัตโนมัติ
export function IssueLicenceForm({ academyId, kind, current }: { academyId: number; kind: keyof typeof ISSUE_KINDS; current?: { level: string | null; tier: string | null } }) {
  const levels = kind === "CHANGE" ? ACADEMY_LEVELS.filter((l) => l !== current?.level) : ACADEMY_LEVELS;
  return (
    <ResultForm action={issueLicence} successText={`${ISSUE_KINDS[kind]}แล้ว`}>
      <input type="hidden" name="academyId" value={academyId} />
      <input type="hidden" name="kind" value={kind} />
      <div className="grid gap-4 sm:grid-cols-2">
        {kind === "RENEW" ? (
          <p className={label}>
            ระดับ
            <span className="rounded-md border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-900">
              FAT {isLevel(current?.level) ? LEVEL_META[current.level].label : "-"} (คงระดับเดิม)
            </span>
          </p>
        ) : (
          <label className={label}>
            <span>
              {kind === "CHANGE" ? "ระดับใหม่" : "ระดับ"}
              <span className="text-red-500"> *</span>
            </span>
            <select name="level" required defaultValue="" className={input}>
              <option value="" disabled>
                เลือกระดับ
              </option>
              {[...levels].reverse().map((l) => (
                <option key={l} value={l}>
                  FAT {LEVEL_META[l].label} ({LEVEL_META[l].th})
                </option>
              ))}
            </select>
          </label>
        )}
        <label className={label}>
          ลีกของสโมสร
          <input name="tier" defaultValue={current?.tier ?? ""} placeholder="T1 / T2 / T3 (เฉพาะสโมสรอาชีพ)" className={input} />
        </label>
        <label className={label}>
          <span>
            วันที่อนุมัติ<span className="text-red-500"> *</span>
          </span>
          <input name="approvedAt" type="date" required defaultValue={bangkokDay(new Date())} className={input} />
        </label>
        <label className={label}>
          วันหมดอายุ
          <input name="expiresAt" type="date" className={input} />
        </label>
        <label className={label}>
          เลขที่ใบอนุญาต
          <input name="licenceNo" placeholder="เว้นว่าง = ออกเลขอัตโนมัติ (FAT-G-ปี-ลำดับ)" className={input} />
        </label>
        <label className={label}>
          หมายเหตุ
          <input name="licenceNote" className={input} />
        </label>
      </div>
      {kind !== "NEW" && <p className="mt-3 text-xs text-slate-500">ใบเดิมจะเปลี่ยนเป็น “เลื่อนระดับ / ต่ออายุแล้ว” และเก็บไว้ในประวัติ</p>}
      <button type="submit" className={`${btn.primary} mt-4`}>
        {SUBMIT[kind]}
      </button>
    </ResultForm>
  );
}

// พักใช้ / เพิกถอนใบที่มีผล — ต้องระบุเหตุผล (เก็บไว้ในหมายเหตุของใบ + บันทึกการแก้ไข)
export function RevokeLicenceForm({ licenceId }: { licenceId: number }) {
  return (
    <ResultForm action={revokeLicence}>
      <input type="hidden" name="id" value={licenceId} />
      <label className={label}>
        <span>
          เหตุผล<span className="text-red-500"> *</span>
        </span>
        <textarea name="reason" rows={2} required placeholder="เช่น ไม่ผ่านการตรวจประเมินประจำปี" className={input} />
      </label>
      <p className="mt-2 text-xs text-slate-500">อคาเดมีจะไม่แสดงบนหน้าสาธารณะจนกว่าจะคืนสถานะหรือออกใบใหม่</p>
      <ConfirmSubmit message="ยืนยันพักใช้ใบอนุญาตนี้?" className={`${btn.dangerSolid} mt-4`}>
        ยืนยันพักใช้
      </ConfirmSubmit>
    </ResultForm>
  );
}
