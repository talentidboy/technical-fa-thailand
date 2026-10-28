"use server";

import { requireStaff } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { changeOwnPassword, type PasswordState } from "@/lib/password-change";

// เปลี่ยนรหัสผ่านของผู้ดูแลระบบ / เจ้าหน้าที่เอง
export async function changeStaffPassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const user = await requireStaff();
  const res = await changeOwnPassword(user.id, formData);
  if (res?.ok) await audit(user.email, "PASSWORD_CHANGE", { summary: `${user.email} เปลี่ยนรหัสผ่านของตัวเอง` });
  return res;
}
