import { levelRank } from "./academy";
import type { AcademyRow } from "./academy-data";

// ข้อมูลอคาเดมีที่ควรตรวจสอบ (ทะเบียนเดิมไม่ครบ / สถานะไม่สอดคล้อง) — ใช้ทั้งหน้าภาพรวมและหน้าทะเบียน
export const ISSUES = {
  "no-active": { label: "ไม่มีใบที่มีผล (ใบเดิมถูกแทนที่)", test: (a: AcademyRow) => !a.current && a.licences.some((l) => l.status === "SUPERSEDED") },
  "no-level": { label: "ยังไม่ระบุระดับ", test: (a: AcademyRow) => a.state === "pending" },
  "no-province": { label: "ไม่มีจังหวัด", test: (a: AcademyRow) => !a.province },
  "no-contact": { label: "ไม่มีเบอร์ / อีเมล", test: (a: AcademyRow) => !a.phone && !a.email },
  "no-date": { label: "ใบอนุญาตไม่มีวันที่อนุมัติ", test: (a: AcademyRow) => !!a.current && !a.current.approvedAt },
  "upgrade-note": {
    label: "หมายเหตุว่าเลื่อนระดับ แต่ยังไม่มีใบระดับใหม่",
    test: (a: AcademyRow) =>
      a.licences.some((l) => {
        const m = l.note?.match(/เลื่อนระดับเป็น\s*(bronze|silver|gold)/i);
        return !!m && levelRank(m[1].toUpperCase()) > levelRank(a.level);
      }),
  },
} as const;
export type IssueKey = keyof typeof ISSUES;

export const issueCounts = (rows: AcademyRow[]) =>
  (Object.keys(ISSUES) as IssueKey[]).map((k) => ({ key: k, label: ISSUES[k].label, n: rows.filter(ISSUES[k].test).length })).filter((i) => i.n > 0);
