import Link from "next/link";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import type { CampaignSummary } from "@/types/reports";
import type { CampaignStatus } from "@/types/campaigns";

export function CampaignSummaryTable({ campaigns }: { campaigns: CampaignSummary[] }) {
  if (campaigns.length === 0) {
    return <EmptyState title="Nenhuma campanha cadastrada ainda" />;
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Campanha</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Total de leads</th>
            <th className="px-3 py-2 font-medium">Ativos</th>
            <th className="px-3 py-2 font-medium">Encerrados</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {campaigns.map((c) => (
            <tr key={c.id} className="hover:bg-muted/30">
              <td className="px-3 py-2">
                <Link href={`/campanhas/${c.id}`} className="font-medium hover:underline">
                  {c.name}
                </Link>
              </td>
              <td className="px-3 py-2">
                <CampaignStatusBadge status={c.status as CampaignStatus} />
              </td>
              <td className="px-3 py-2">{c.totalLeads}</td>
              <td className="px-3 py-2">{c.activeLeads}</td>
              <td className="px-3 py-2">{c.closedLeads}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
