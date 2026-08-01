import { EmptyState } from "@/components/feedback/empty-state";
import type { ClosingReasonCount } from "@/types/reports";

export function ClosingReasonsBreakdown({ reasons }: { reasons: ClosingReasonCount[] }) {
  if (reasons.length === 0) {
    return <EmptyState title="Nenhum encerramento no período" />;
  }

  const max = Math.max(...reasons.map((r) => r.count));

  return (
    <ul className="flex flex-col gap-2">
      {reasons.map((reason) => (
        <li key={reason.name} className="flex items-center gap-3 text-sm">
          <span className="w-40 shrink-0 truncate text-muted-foreground">{reason.name}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(reason.count / max) * 100}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right font-medium">{reason.count}</span>
        </li>
      ))}
    </ul>
  );
}
