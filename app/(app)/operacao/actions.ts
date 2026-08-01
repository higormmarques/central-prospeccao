"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addDaysIso, mapStepToTaskType } from "@/lib/cadence";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  return { supabase, userId: user.id };
}

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function completeTask(taskId: string, formData: FormData) {
  const { supabase, userId } = await requireUser();

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, lead_id, lead_campaign_id, cadence_step_id")
    .eq("id", taskId)
    .single();
  if (taskError) throw taskError;

  const channel = str(formData, "channel") ?? "whatsapp";
  const description = str(formData, "description");
  const result = str(formData, "result");
  const nextAction = str(formData, "next_action") ?? "custom";
  const contactId = str(formData, "contact_id");

  let nextActionType: string | null = null;
  let nextActionDate: string | null = null;

  if (nextAction === "close") {
    const closingReasonId = str(formData, "closing_reason_id");
    if (!closingReasonId) throw new Error("Selecione um motivo de encerramento.");

    if (task.lead_campaign_id) {
      const { error } = await supabase
        .from("lead_campaigns")
        .update({
          status: "encerrado",
          is_active: false,
          closed_at: new Date().toISOString(),
          closing_reason_id: closingReasonId,
        })
        .eq("id", task.lead_campaign_id);
      if (error) throw error;
    }
    nextActionType = "encerramento";
  } else if (nextAction === "continue") {
    if (!task.cadence_step_id) throw new Error("Esta tarefa não está vinculada a uma cadência.");

    const { data: currentStep, error: stepError } = await supabase
      .from("cadence_steps")
      .select("cadence_id, step_order")
      .eq("id", task.cadence_step_id)
      .single();
    if (stepError) throw stepError;

    const { data: nextStep } = await supabase
      .from("cadence_steps")
      .select("id, step_order, action_type, is_closing_step, interval_days, name")
      .eq("cadence_id", currentStep.cadence_id)
      .eq("step_order", currentStep.step_order + 1)
      .maybeSingle();

    if (!nextStep) {
      throw new Error("Não há próxima etapa configurada nesta cadência — encerre esta participação.");
    }

    const scheduledDate = addDaysIso(nextStep.interval_days);

    const { error: newTaskError } = await supabase.from("tasks").insert({
      lead_id: task.lead_id,
      lead_campaign_id: task.lead_campaign_id,
      cadence_step_id: nextStep.id,
      assigned_user_id: userId,
      task_type: mapStepToTaskType(nextStep),
      scheduled_date: scheduledDate,
    });
    if (newTaskError) throw newTaskError;

    if (task.lead_campaign_id) {
      await supabase
        .from("lead_campaigns")
        .update({ current_cadence_step_id: nextStep.id, status: "em_followup" })
        .eq("id", task.lead_campaign_id);
    }

    nextActionType = nextStep.name;
    nextActionDate = scheduledDate;
  } else {
    const customDate = str(formData, "custom_date");
    const customTaskType = str(formData, "custom_task_type") ?? "followup";
    if (!customDate) throw new Error("Informe a data da próxima ação.");

    const { error: newTaskError } = await supabase.from("tasks").insert({
      lead_id: task.lead_id,
      lead_campaign_id: task.lead_campaign_id,
      assigned_user_id: userId,
      task_type: customTaskType,
      scheduled_date: customDate,
    });
    if (newTaskError) throw newTaskError;

    nextActionType = customTaskType;
    nextActionDate = customDate;
  }

  const { error: interactionError } = await supabase.from("interactions").insert({
    lead_id: task.lead_id,
    lead_campaign_id: task.lead_campaign_id,
    contact_id: contactId,
    task_id: taskId,
    user_id: userId,
    channel,
    interaction_type: channel,
    direction: "outbound",
    description,
    result,
    occurred_at: new Date().toISOString(),
    next_action_type: nextActionType,
    next_action_date: nextActionDate,
  });
  if (interactionError) throw interactionError;

  const { error: completeError } = await supabase
    .from("tasks")
    .update({ status: "concluida", completed_at: new Date().toISOString(), result })
    .eq("id", taskId);
  if (completeError) throw completeError;

  revalidatePath("/operacao");
  revalidatePath("/leads");
  if (task.lead_campaign_id) revalidatePath("/campanhas");
}

export async function postponeTask(taskId: string, newDate: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("tasks").update({ scheduled_date: newDate }).eq("id", taskId);
  if (error) throw error;
  revalidatePath("/operacao");
}

export async function cancelTask(taskId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("tasks").update({ status: "cancelada" }).eq("id", taskId);
  if (error) throw error;
  revalidatePath("/operacao");
}
