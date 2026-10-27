import { BrandLogo } from "@/components/BrandLogo";
import Link from "next/link";
import { AcademyLogo } from "@/components/SectionLogos";

// แถบบนของพอร์ทัลอคาเดมี: พื้นฟ้าแบบโปสเตอร์ (เหมือนแผงซ้ายของหน้าเข้าสู่ระบบ)
export function AcademyTopBar({ subtitle, children }: { subtitle: string; children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 bg-[#1e96dc] text-[#0b1220]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <Link href="/academies/portal" className="flex min-w-0 items-center gap-2.5">
          <BrandLogo tone="navy" className="h-9 flex-none" />
          <span aria-hidden className="hidden h-8 w-px bg-[#0b1220]/20 sm:block" />
          <div className="min-w-0">
            <AcademyLogo className="h-7" />
            <p className="mt-0.5 truncate text-[11px] font-semibold text-[#0b1220]/75">{subtitle}</p>
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
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1e96dc] focus:outline-none focus:ring-3 focus:ring-[#1e96dc]/15";

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
