export type TaskType = "abordagem" | "followup" | "ligacao" | "encerramento";
export type TaskStatus = "pendente" | "concluida" | "cancelada" | "atrasada";

export type TaskQueueItem = {
  id: string;
  task_type: TaskType;
  priority: "baixa" | "media" | "alta" | "urgente";
  scheduled_date: string;
  scheduled_time: string | null;
  lead_id: string;
  lead_campaign_id: string | null;
  cadence_step_id: string | null;
  lead: { id: string; name: string; trade_name: string | null; city: string | null; state: string | null } | null;
  lead_campaign: {
    id: string;
    status: string;
    campaign: { id: string; name: string } | null;
  } | null;
  cadence_step: { id: string; name: string; action_type: string; cadence_id: string; step_order: number } | null;
  primary_contact: { name: string; whatsapp_number: string | null; phone_normalized: string | null } | null;
};
