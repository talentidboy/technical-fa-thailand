import { redirect } from "next/navigation";

// หน้าแก้ไขข้อมูลย้ายไปรวมอยู่ในหน้าตั้งค่าแล้ว
export default function EditMyProfilePage() {
  redirect("/me/settings#profile");
}
