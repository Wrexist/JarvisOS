import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-1 w-full" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-1 w-full" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-1 w-full" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}
