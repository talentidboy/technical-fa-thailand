import { Pulse } from "@/components/talent-id/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Pulse className="h-4 w-24" />
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap items-center gap-6">
          <Pulse className="h-28 w-28 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Pulse className="h-6 w-48" />
            <Pulse className="h-4 w-32" />
            <div className="flex gap-1.5 pt-1">
              <Pulse className="h-6 w-20 rounded-full" />
              <Pulse className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <Pulse className="h-10 w-72" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Pulse className="h-40 lg:col-span-2" />
        <Pulse className="h-40" />
      </div>
    </div>
  );
}
