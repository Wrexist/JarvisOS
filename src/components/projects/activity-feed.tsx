interface ActivityItem {
  id: string;
  type: string;
  message: string | null;
  createdAt: string;
}

export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No activity yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 text-sm"
        >
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/50" />
          <div className="min-w-0 flex-1">
            <p className="text-foreground">
              {activity.message ?? activity.type}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(activity.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
