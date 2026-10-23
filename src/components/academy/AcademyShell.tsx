import { BrandLogo } from "@/components/BrandLogo";
import Link from "next/link";
import { AcademyLogo } from "@/components/SectionLogos";

// แถบบนของหน้าในโหมด Academy Licensing (เข้าสู่ระบบ / สมัคร / พอร์ทัล)
export function AcademyTopBar({ subtitle, children }: { subtitle: string; children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-indigo-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/academies" className="flex min-w-0 items-center gap-2.5">
          <BrandLogo tone="white" className="h-9" />
          <div className="min-w-0">
            <AcademyLogo className="h-7" />
            <p className="mt-0.5 truncate text-[11px] text-indigo-300">{subtitle}</p>
          </div>
        </Link>
        <div className="flex flex-none items-center gap-2">{children}</div>
      </div>
    </header>
  );
}

// ช่องกรอกแบบมีไอคอนด้านซ้าย (หน้าเข้าสู่ระบบ)
export const authInputClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100";

export const fieldClass =
  "w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

export function TextField({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
  autoComplete,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number | null;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={fieldClass}
      />
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </label>
  );
}
