import { Pulse, SkeletonKpiRow, SkeletonCard } from "@/components/talent-id/Skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mb-8">
        <Pulse className="h-14 w-14" />
        <Pulse className="mt-4 h-7 w-40" />
        <Pulse className="mt-2 h-4 w-72" />
      </div>
      <div className="space-y-6">
        <SkeletonKpiRow />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
