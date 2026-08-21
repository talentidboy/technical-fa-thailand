import { Pulse } from "@/components/talent-id/Skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mb-8">
        <Pulse className="h-14 w-14" />
        <Pulse className="mt-4 h-7 w-56" />
        <Pulse className="mt-2 h-4 w-80" />
      </div>
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-2 border-b border-white/10 px-6 py-4">
              <Pulse className="h-8 w-8" />
              <Pulse className="h-4 w-24" />
            </div>
            {Array.from({ length: 3 }).map((__, j) => (
              <div key={j} className="flex items-center gap-4 border-b border-white/10 px-6 py-3.5 last:border-0">
                <Pulse className="h-7 w-7 flex-none rounded-full" />
                <Pulse className="h-9 w-9 flex-none rounded-full" />
                <Pulse className="h-4 w-40" />
                <Pulse className="ml-auto h-6 w-14" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
