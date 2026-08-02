"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isTestModeActive, setTestModeCookie } from "@/lib/test-mode";
import type { ReasonType } from "@/types/settings";
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

export async function updateUserRoleStatus(
  targetUserId: string,
  params: { roleId: string | null; status: "active" | "inactive" },
) {
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("users")
    .update({ role_id: params.roleId, status: params.status })
    .eq("id", targetUserId);

  if (error) {
    if (error.code === "42501") {
      throw new Error("Apenas administradores podem gerenciar outros usuários.");
    }
    throw error;
  }

  revalidatePath("/configuracoes");
}

export async function createReason(formData: FormData) {
  const { supabase, userId } = await requireUser();

  const name = str(formData, "name");
  const type = str(formData, "type") as ReasonType | null;
  if (!name || !type) throw new Error("Nome e tipo são obrigatórios.");

  const { error } = await supabase.from("reasons").insert({
    type,
    name,
    description: str(formData, "description"),
    created_by: userId,
    updated_by: userId,
  });

  if (error) throw error;
  revalidatePath("/configuracoes");
}

export async function updateReason(reasonId: string, formData: FormData) {
  const { supabase, userId } = await requireUser();

  const name = str(formData, "name");
  if (!name) throw new Error("Nome é obrigatório.");

  const { error } = await supabase
    .from("reasons")
    .update({
      name,
      description: str(formData, "description"),
      updated_by: userId,
    })
    .eq("id", reasonId);

  if (error) throw error;
  revalidatePath("/configuracoes");
}

export async function toggleReasonActive(reasonId: string, isActive: boolean) {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("reasons")
    .update({ is_active: isActive, updated_by: userId })
    .eq("id", reasonId);
  if (error) throw error;
  revalidatePath("/configuracoes");
}

export async function setTestMode(active: boolean) {
  await requireUser();
  await setTestModeCookie(active);
  revalidatePath("/", "layout");
}

export async function createCadenceTemplate(formData: FormData) {
  const { supabase, userId } = await requireUser();

  const name = str(formData, "name");
  if (!name) throw new Error("Nome do modelo é obrigatório.");

  const { error } = await supabase.from("cadences").insert({
    name,
    description: str(formData, "description"),
    channel: str(formData, "channel"),
    is_template: true,
    is_test: await isTestModeActive(),
    created_by: userId,
    updated_by: userId,
  });

  if (error) throw error;
  revalidatePath("/configuracoes");
}

export async function toggleCadenceTemplateStatus(cadenceId: string, status: "active" | "inactive") {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("cadences").update({ status, updated_by: userId }).eq("id", cadenceId);
  if (error) throw error;
  revalidatePath("/configuracoes");
}

export async function addTemplateCadenceStep(cadenceId: string, formData: FormData) {
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
  revalidatePath("/configuracoes");
}

export async function deleteTemplateCadenceStep(stepId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("cadence_steps").delete().eq("id", stepId);
  if (error) throw error;
  revalidatePath("/configuracoes");
}
