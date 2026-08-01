import { Badge } from "@/components/ui/badge";
import type { CampaignStatus } from "@/types/campaigns";

const LABEL: Record<CampaignStatus, string> = {
  draft: "Rascunho",
  active: "Ativa",
  paused: "Pausada",
  finished: "Finalizada",
  archived: "Arquivada",
};

const VARIANT: Record<CampaignStatus, "default" | "secondary" | "outline"> = {
  draft: "outline",
  active: "default",
  paused: "secondary",
  finished: "outline",
  archived: "outline",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
