import { getProvinceOptions } from "@/lib/thai-address";
import { ResultForm } from "@/components/ResultForm";
import { Card, PageBody, PageHeader, btn } from "@/components/academy/ManageUi";
import { createAcademy } from "../../actions";
import { AcademyFields, LicenceFields } from "../../fields";
import { Plus } from "lucide-react";

export default function NewAcademyPage() {
  const provinces = getProvinceOptions().map((p) => p.nameTh);
  return (
    <>
      <PageHeader title="เพิ่มอคาเดมี" description="เพิ่มอคาเดมีเข้าทะเบียนโดยเจ้าหน้าที่ — อคาเดมีสมัครเองได้ที่หน้าสมัครของพอร์ทัล" crumbs={[{ href: "/academies/manage/academies", label: "อคาเดมี" }]} />
      <PageBody>
        <ResultForm action={createAcademy} className="space-y-6">
          <Card title="ข้อมูลอคาเดมี">
            <AcademyFields provinces={provinces} />
          </Card>
          <Card title="ใบอนุญาตใบแรก (ไม่บังคับ)">
            <p className="mb-4 text-xs text-slate-500">เลือกระดับเพื่อออกใบอนุญาตพร้อมกัน · เลขที่ใบอนุญาตเว้นว่างได้ ระบบออกเลขให้อัตโนมัติ (FAT-G-ปี-ลำดับ)</p>
            <LicenceFields />
          </Card>
          <button type="submit" className={btn.primary}>
            <Plus className="h-4 w-4" />
            เพิ่มอคาเดมี
          </button>
        </ResultForm>
      </PageBody>
    </>
  );
}
