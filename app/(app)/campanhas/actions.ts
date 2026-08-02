"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { linkLeadToCampaign } from "@/lib/cadence";
import { isTestModeActive } from "@/lib/test-mode";
import type { CampaignPriority, CampaignStatus } from "@/types/campaigns";
import type { CadenceActionType } from "@/types/cadences";

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

export async function createCampaign(formData: FormData) {
  const { supabase, userId } = await requireUser();

  const name = str(formData, "name");
  if (!name) throw new Error("Nome da campanha é obrigatório.");

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      name,
      objective: str(formData, "objective"),
      description: str(formData, "description"),
      priority: (str(formData, "priority") as CampaignPriority | null) ?? "media",
      start_date: str(formData, "start_date"),
      end_date: str(formData, "end_date"),
      owner_user_id: userId,
      is_test: await isTestModeActive(),
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (error) throw error;
  revalidatePath("/campanhas");
  return { id: campaign.id as string };
}

export async function updateCampaign(campaignId: string, formData: FormData) {
  const { supabase, userId } = await requireUser();

  const name = str(formData, "name");
  if (!name) throw new Error("Nome da campanha é obrigatório.");

  const { error } = await supabase
    .from("campaigns")
    .update({
      name,
      objective: str(formData, "objective"),
      description: str(formData, "description"),
      priority: (str(formData, "priority") as CampaignPriority | null) ?? "media",
      start_date: str(formData, "start_date"),
      end_date: str(formData, "end_date"),
      updated_by: userId,
    })
    .eq("id", campaignId);

  if (error) throw error;
  revalidatePath("/campanhas");
  revalidatePath(`/campanhas/${campaignId}`);
}

export async function setCampaignStatus(campaignId: string, status: CampaignStatus) {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("campaigns")
    .update({ status, updated_by: userId })
    .eq("id", campaignId);
  if (error) throw error;
  revalidatePath("/campanhas");
  revalidatePath(`/campanhas/${campaignId}`);
}

export async function linkExistingLead(campaignId: string, leadId: string) {
  const { supabase, userId } = await requireUser();

  const { data: existing } = await supabase
    .from("lead_campaigns")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("lead_id", leadId)
    .eq("is_active", true)
    .maybeSingle();

  if (existing) {
    throw new Error("Este lead já participa ativamente desta campanha.");
  }

  await linkLeadToCampaign(supabase, { leadId, campaignId, userId });

  revalidatePath(`/campanhas/${campaignId}`);
  revalidatePath("/operacao");
}

export async function removeLeadFromCampaign(campaignId: string, leadCampaignId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("lead_campaigns")
    .update({ is_active: false, closed_at: new Date().toISOString() })
    .eq("id", leadCampaignId);
  if (error) throw error;
  revalidatePath(`/campanhas/${campaignId}`);
}

export async function searchLeadsForLinking(query: string) {
  const { supabase } = await requireUser();
  const term = query.trim();
  if (!term) return [];

  const { data, error } = await supabase
    .from("leads")
    .select("id, name, trade_name")
    .eq("is_test", await isTestModeActive())
    .neq("general_status", "arquivado")
    .or(`name.ilike.%${term}%,trade_name.ilike.%${term}%`)
    .limit(10);

  if (error) throw error;
  return data ?? [];
}

export async function createCadenceForCampaign(campaignId: string, name: string) {
  const { supabase, userId } = await requireUser();

  const { data: cadence, error: cadenceError } = await supabase
    .from("cadences")
    .insert({ name, is_test: await isTestModeActive(), created_by: userId, updated_by: userId })
    .select("id")
    .single();

  if (cadenceError) throw cadenceError;

  const { error: linkError } = await supabase
    .from("campaigns")
    .update({ cadence_id: cadence.id, updated_by: userId })
    .eq("id", campaignId);

  if (linkError) throw linkError;
  revalidatePath(`/campanhas/${campaignId}`);
}

export async function useTemplateForCampaign(campaignId: string, templateId: string) {
  const { supabase, userId } = await requireUser();
  const testMode = await isTestModeActive();

  const { data: template, error: templateError } = await supabase
    .from("cadences")
    .select(
      "name, description, channel, cadence_steps(name, step_order, action_type, interval_days, is_required, is_closing_step)",
    )
    .eq("id", templateId)
    .eq("is_template", true)
    .eq("is_test", testMode)
    .single();

  if (templateError) throw templateError;

  const { data: cadence, error: cadenceError } = await supabase
    .from("cadences")
    .insert({
      name: template.name,
      description: template.description,
      channel: template.channel,
      is_template: false,
      is_test: testMode,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (cadenceError) throw cadenceError;

  const steps = template.cadence_steps ?? [];
  if (steps.length > 0) {
    const { error: stepsError } = await supabase.from("cadence_steps").insert(
      steps.map((step) => ({
        cadence_id: cadence.id,
        name: step.name,
        step_order: step.step_order,
        action_type: step.action_type,
        interval_days: step.interval_days,
        is_required: step.is_required,
        is_closing_step: step.is_closing_step,
      })),
    );
    if (stepsError) throw stepsError;
  }

  const { error: linkError } = await supabase
    .from("campaigns")
    .update({ cadence_id: cadence.id, updated_by: userId })
    .eq("id", campaignId);

  if (linkError) throw linkError;
  revalidatePath(`/campanhas/${campaignId}`);
}

export async function addCadenceStep(cadenceId: string, campaignId: string, formData: FormData) {
  const { supabase } = await requireUser();

  const name = str(formData, "name");
  if (!name) throw new Error("Nome da etapa é obrigatório.");

  const { data: last } = await supabase
    .from("cadence_steps")
    .select("step_order")
    .eq("cadence_id", cadenceId)
    .order("step_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (last?.step_order ?? 0) + 1;

  const { error } = await supabase.from("cadence_steps").insert({
    cadence_id: cadenceId,
    name,
    step_order: nextOrder,
    action_type: (str(formData, "action_type") as CadenceActionType | null) ?? "whatsapp",
    interval_days: Number(str(formData, "interval_days") ?? "0") || 0,
    is_closing_step: formData.get("is_closing_step") === "on",
  });

  if (error) throw error;
  revalidatePath(`/campanhas/${campaignId}`);
}

export async function deleteCadenceStep(stepId: string, campaignId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("cadence_steps").delete().eq("id", stepId);
  if (error) throw error;
  revalidatePath(`/campanhas/${campaignId}`);
}
