import { CheckCircle2, FileText, XCircle } from "lucide-react";
import { EVIDENCE_STATUS } from "@/lib/academy-portal";
import type { AutoCheck } from "@/lib/academy-checks";

// ส่วนประกอบที่ใช้ร่วมกันระหว่างหน้าใบสมัคร (อคาเดมี) และหน้าตรวจ (แอดมิน)

export function EvidenceStatusChip({ status }: { status: string }) {
  const meta = EVIDENCE_STATUS[status] ?? EVIDENCE_STATUS.PENDING;
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${meta.tone}`}>{meta.label}</span>;
}

export function AutoCheckBox({ check }: { check: AutoCheck }) {
  return (
    <p className={`mt-2 flex items-start gap-1.5 rounded-xl px-3 py-2 text-xs ${check.ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
      {check.ok ? <CheckCircle2 className="mt-px h-3.5 w-3.5 flex-none" /> : <XCircle className="mt-px h-3.5 w-3.5 flex-none" />}
      <span>
        <span className="font-semibold">ระบบตรวจจากข้อมูลบุคลากร/ทีม: </span>
        {check.detail}
      </span>
    </p>
  );
}

const size = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export function DocumentLink({ doc }: { doc: { id: number; fileName: string; size: number } }) {
  return (
    <a href={`/academies/docs/${doc.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 items-center gap-1.5 text-sm text-indigo-700 hover:underline">
      <FileText className="h-4 w-4 flex-none" />
      <span className="truncate">{doc.fileName}</span>
      <span className="flex-none text-xs text-slate-400">{size(doc.size)}</span>
    </a>
  );
}
