"use server";

import { requireCoach } from "@/lib/auth";
import { changeOwnPassword, type PasswordState } from "@/lib/password-change";

// เปลี่ยนรหัสผ่านของผู้ฝึกสอนเอง
export async function changeMyPassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const user = await requireCoach();
  return changeOwnPassword(user.id, formData);
}
