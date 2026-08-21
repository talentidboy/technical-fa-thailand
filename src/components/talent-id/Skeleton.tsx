export function Pulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className}`} />;
}

export function SkeletonKpiRow({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <Pulse className="h-9 w-9" />
          <Pulse className="mt-4 h-3 w-20" />
          <Pulse className="mt-2 h-6 w-14" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 p-6 ${className}`}>
      <Pulse className="mb-4 h-4 w-40" />
      <Pulse className="h-56 w-full" />
    </div>
  );
}
