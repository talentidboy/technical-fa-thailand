import type { LucideIcon } from "lucide-react";

export function InfoPill({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 ${
        accent ? "border-amber-400/40 bg-amber-400/10" : "border-white/10 bg-white/5"
      }`}
    >
      <p
        className={`text-[9px] font-semibold uppercase tracking-wider ${
          accent ? "text-amber-400/80" : "text-indigo-400"
        }`}
      >
        {label}
      </p>
      <div className={`mt-0.5 flex items-center gap-1.5 text-sm font-semibold ${accent ? "text-amber-300" : "text-white"}`}>
        {Icon && <Icon className={`h-3.5 w-3.5 flex-none ${accent ? "text-amber-400" : "text-indigo-400"}`} />}
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}
