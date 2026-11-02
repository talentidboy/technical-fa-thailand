import { ResultForm } from "@/components/ResultForm";
import { updateLicenseRecord } from "@/app/(admin)/coaches/[id]/actions";
import { Pencil } from "lucide-react";

const day = (d: Date | null) => (d ? d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }) : "");
const field = "w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

// ปุ่ม "แก้ไข" ใบอนุญาต (แอดมิน) — กดแล้วฟอร์มแก้เลขที่ใบ / วันที่ออก / วันหมดอายุ กางลงในแถวเดิม
// (ไม่ใช้แผงลอย เพราะตารางที่เลื่อนแนวนอนได้จะตัดแผงที่ล้นออกไป)
export function LicenseEditForm({ record }: { record: { id: number; certificateNo: string | null; issueDate: Date | null; expireDate: Date | null } }) {
  return (
    <details className="group">
      <summary aria-label="แก้ไขใบอนุญาต" title="แก้ไขเลขที่ใบและวันที่" className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-indigo-50 hover:text-indigo-700">
        <Pencil className="h-3.5 w-3.5" />
        แก้ไข
      </summary>
      <ResultForm action={updateLicenseRecord} className="mt-1.5 w-72 space-y-2.5 rounded-xl bg-white p-3.5 text-left shadow-lg ring-1 ring-slate-200">
        <input type="hidden" name="id" value={record.id} />
        <label className="block text-xs font-medium text-slate-600">
          เลขที่ใบอนุญาต
          <input name="certificateNo" defaultValue={record.certificateNo ?? ""} placeholder="เช่น C-24/0012" className={`${field} mt-1`} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-medium text-slate-600">
            วันที่ออกใบ
            <input name="issueDate" type="date" defaultValue={day(record.issueDate)} className={`${field} mt-1`} />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            วันหมดอายุ
            <input name="expireDate" type="date" defaultValue={day(record.expireDate)} className={`${field} mt-1`} />
          </label>
        </div>
        <button type="submit" className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          บันทึก
        </button>
      </ResultForm>
    </details>
  );
}
