export function InfoPill({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-400">
        {label}
      </p>
      <div
        className={`mt-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
          accent
            ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
            : "border-white/15 bg-white/5 text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
