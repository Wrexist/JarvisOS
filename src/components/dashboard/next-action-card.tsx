import { Zap } from "lucide-react";
import Link from "next/link";

export function NextActionCard({
  action,
  reason,
  href,
}: {
  action: string;
  reason: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="glass-panel p-5 border-primary/20 hover:border-primary/40 transition-colors">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-primary uppercase tracking-wider">
              Next Best Action
            </p>
            <p className="text-lg font-semibold mt-1">{action}</p>
            <p className="text-sm text-muted-foreground mt-1">{reason}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
