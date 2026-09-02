import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export function isEmailConfigured() {
  return resend !== null;
}

// EMAIL_FROM ควรเป็นที่อยู่บนโดเมนที่ verify กับ Resend แล้ว (เช่น "FA Thailand Technical <noreply@fathailand.org>")
// ถ้ายังไม่ verify โดเมน ใช้ sandbox "onboarding@resend.dev" ได้ชั่วคราว แต่จะส่งได้เฉพาะอีเมลของเจ้าของบัญชี Resend เท่านั้น
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!resend) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }
  const from = process.env.EMAIL_FROM || "FA Thailand Technical <onboarding@resend.dev>";
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    throw new Error(`ส่งอีเมลไม่สำเร็จ: ${error.message}`);
  }
}
