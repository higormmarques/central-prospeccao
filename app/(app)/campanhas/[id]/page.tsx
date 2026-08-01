import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CampaignHeader } from "@/components/campaigns/campaign-header";
import { CampaignLeadsTab } from "@/components/campaigns/campaign-leads-tab";
import { CadenceEditor } from "@/components/campaigns/cadence-editor";
import { getCadenceTemplateOptions, getCampaignDetail } from "../queries";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let campaign;
  try {
    campaign = await getCampaignDetail(id);
  } catch {
    notFound();
  }
  if (!campaign) notFound();

  const cadenceTemplates = await getCadenceTemplateOptions();

  const owner = one(campaign.owner);
  const cadence = one(campaign.cadence);
  const leadCampaigns = campaign.lead_campaigns ?? [];
  const activeCount = leadCampaigns.filter((lc: { is_active: boolean }) => lc.is_active).length;
  const closedCount = leadCampaigns.length - activeCount;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs current={campaign.name} />

      <CampaignHeader campaign={campaign} ownerName={owner?.name ?? null} />

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-semibold">{leadCampaigns.length}</p>
          <p className="text-xs text-muted-foreground">Total de leads</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-semibold">{activeCount}</p>
          <p className="text-xs text-muted-foreground">Ativos</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-semibold">{closedCount}</p>
          <p className="text-xs text-muted-foreground">Encerrados</p>
        </div>
      </div>

      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="cadencia">Cadência</TabsTrigger>
        </TabsList>
        <TabsContent value="leads" className="pt-4">
          <CampaignLeadsTab campaignId={campaign.id} leadCampaigns={leadCampaigns} />
        </TabsContent>
        <TabsContent value="cadencia" className="pt-4">
          <CadenceEditor
            campaignId={campaign.id}
            campaignName={campaign.name}
            cadence={
              cadence
                ? { id: cadence.id, name: cadence.name, steps: cadence.cadence_steps ?? [] }
                : null
            }
            templates={cadenceTemplates}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
