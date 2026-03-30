import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  detail,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  detail?: string;
}) {
  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
      {detail && (
        <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
      )}
    </div>
  );
}
