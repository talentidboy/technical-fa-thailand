import { Pulse } from "@/components/talent-id/Skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mb-8">
        <Pulse className="h-7 w-40" />
        <Pulse className="mt-2 h-4 w-64" />
      </div>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <Pulse className="h-10 w-full" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Pulse className="h-14" />
          <Pulse className="h-14" />
          <Pulse className="h-14" />
          <Pulse className="h-14" />
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-white/10 px-4 py-3.5 last:border-0">
            <Pulse className="h-8 w-8 flex-none rounded-full" />
            <Pulse className="h-4 w-40" />
            <Pulse className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
