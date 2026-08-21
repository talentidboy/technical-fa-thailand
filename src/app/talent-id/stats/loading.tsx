import { Pulse } from "@/components/talent-id/Skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mb-8">
        <Pulse className="h-14 w-14" />
        <Pulse className="mt-4 h-7 w-48" />
        <Pulse className="mt-2 h-4 w-80" />
      </div>
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Pulse key={i} className="h-24" />
          ))}
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i}>
            <Pulse className="mb-4 h-4 w-32" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Pulse className="h-40" />
              <Pulse className="h-40" />
              <Pulse className="h-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
