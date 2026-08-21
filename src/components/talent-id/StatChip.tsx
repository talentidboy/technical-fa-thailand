import { ratingTier } from "@/lib/rating-scale";

export function StatChip({ label, value, percent }: { label: string; value: number; percent: number }) {
  const tier = value === 0 ? null : ratingTier(percent);
  return (
    <div className={`rounded-lg px-2 py-1.5 text-center ${tier ? tier.bg : "bg-white/5"}`}>
      <p className={`text-base font-black leading-none ${tier ? tier.text : "text-indigo-500"}`}>{value}</p>
      <p className="mt-1 truncate text-[9px] uppercase tracking-wide text-indigo-300">{label}</p>
    </div>
  );
}
