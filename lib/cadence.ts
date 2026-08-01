import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskType } from "@/types/operations";

/**
 * tasks.task_type (natureza da tarefa no funil) e cadence_steps.action_type
 * (canal da etapa) são domínios diferentes — esta função faz a ponte.
 */
export function mapStepToTaskType(step: {
  step_order: number;
  action_type: string;
  is_closing_step: boolean;
}): TaskType {
  if (step.is_closing_step) return "encerramento";
  if (step.step_order === 1) return "abordagem";
  if (step.action_type === "ligacao") return "ligacao";
  return "followup";
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Vincula um lead a uma campanha e, se a campanha tiver cadência, cria
 * automaticamente a primeira tarefa (Etapa 06 -> Etapa 07). Usado tanto
 * pela vinculação manual (Campanhas) quanto pela importação (Etapa 10).
 */
export async function linkLeadToCampaign(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  params: { leadId: string; campaignId: string; userId: string },
) {
  const { leadId, campaignId, userId } = params;

  const { data: leadCampaign, error } = await supabase
    .from("lead_campaigns")
    .insert({
      campaign_id: campaignId,
      lead_id: leadId,
      assigned_user_id: userId,
      status: "novo",
    })
    .select("id")
    .single();

  if (error) throw error;

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("cadence_id")
    .eq("id", campaignId)
    .single();

  if (campaign?.cadence_id) {
    const { data: firstStep } = await supabase
      .from("cadence_steps")
      .select("id, step_order, action_type, is_closing_step")
      .eq("cadence_id", campaign.cadence_id)
      .eq("step_order", 1)
      .maybeSingle();

    if (firstStep) {
      await supabase.from("tasks").insert({
        lead_id: leadId,
        lead_campaign_id: leadCampaign.id,
        cadence_step_id: firstStep.id,
        assigned_user_id: userId,
        task_type: mapStepToTaskType(firstStep),
        scheduled_date: todayIso(),
      });

      await supabase
        .from("lead_campaigns")
        .update({ current_cadence_step_id: firstStep.id, status: "em_abordagem" })
        .eq("id", leadCampaign.id);
    }
  }

  return leadCampaign.id as string;
}
