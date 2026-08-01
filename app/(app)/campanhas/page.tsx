import { Megaphone } from "lucide-react";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { EmptyState } from "@/components/feedback/empty-state";
import { NewCampaignDialog } from "@/components/campaigns/new-campaign-dialog";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { getCampaigns } from "./queries";
import type { CampaignStatus } from "@/types/campaigns";

export default async function CampanhasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const campaigns = await getCampaigns({ status: status as CampaignStatus | undefined });

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs current="Campanhas" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Campanhas</h1>
          <p className="text-sm text-muted-foreground">
            Organize grupos de leads em torno de um objetivo comercial comum.
          </p>
        </div>
        <NewCampaignDialog />
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Nenhuma campanha ainda"
          description="Crie a primeira campanha para começar a organizar a operação."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
