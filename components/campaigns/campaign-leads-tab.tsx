"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { LinkLeadDialog } from "@/components/campaigns/link-lead-dialog";
import { removeLeadFromCampaign } from "@/app/(app)/campanhas/actions";
import { Users } from "lucide-react";

type LeadCampaignRow = {
  id: string;
  status: string;
  entered_at: string;
  is_active: boolean;
  lead: { id: string; name: string; trade_name: string | null; city: string | null; state: string | null } | null;
  assigned_user: { name: string } | null;
};

export function CampaignLeadsTab({
  campaignId,
  leadCampaigns,
}: {
  campaignId: string;
  leadCampaigns: LeadCampaignRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleRemove(leadCampaignId: string) {
    startTransition(async () => {
      try {
        await removeLeadFromCampaign(campaignId, leadCampaignId);
        toast.success("Lead removido da campanha.");
        router.refresh();
      } catch {
        toast.error("Não foi possível remover o lead.");
      }
    });
  }

  const active = leadCampaigns.filter((lc) => lc.is_active);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <LinkLeadDialog campaignId={campaignId} />
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum lead vinculado"
          description="Vincule leads existentes da Base de Leads a esta campanha."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Lead</th>
                <th className="px-3 py-2 font-medium">Cidade/UF</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Responsável</th>
                <th className="px-3 py-2 font-medium">Entrada</th>
                <th className="px-3 py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {active.map((lc) => (
                <tr key={lc.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <Link href={`/leads?lead=${lc.lead?.id}`} className="font-medium hover:underline">
                      {lc.lead?.name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {lc.lead?.city ? `${lc.lead.city}/${lc.lead.state ?? ""}` : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="outline">{lc.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{lc.assigned_user?.name ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {new Date(lc.entered_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isPending}
                      onClick={() => handleRemove(lc.id)}
                      title="Remover da campanha"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
