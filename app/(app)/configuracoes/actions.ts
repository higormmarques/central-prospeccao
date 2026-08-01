"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReasonType } from "@/types/settings";

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
