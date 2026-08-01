export type CampaignStatus = "draft" | "active" | "paused" | "finished" | "archived";
export type CampaignPriority = "baixa" | "media" | "alta";

export type Campaign = {
  id: string;
  name: string;
  objective: string | null;
  description: string | null;
  status: CampaignStatus;
  priority: CampaignPriority;
  owner_user_id: string | null;
  cadence_id: string | null;
  start_date: string | null;
  end_date: string | null;
  is_template: boolean;
  created_at: string;
  updated_at: string;
};

export type CampaignListItem = Campaign & {
  owner_user_name: string | null;
  total_leads: number;
  active_leads: number;
  closed_leads: number;
};

export type LeadCampaignStatus =
  | "importado"
  | "novo"
  | "em_abordagem"
  | "em_followup"
  | "aguardando_resposta"
  | "em_negociacao"
  | "agendamento_solicitado"
  | "encerrado"
  | "arquivado";
