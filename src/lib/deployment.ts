// รหัสเวอร์ชันของการ deploy ครั้งนี้ (บน Vercel) — ใช้คู่กับ deploymentId ใน next.config.ts
// เครื่องนักพัฒนา = "dev" (ไม่มีการเช็กเวอร์ชัน)
export const DEPLOYMENT_ID = process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || "dev";
