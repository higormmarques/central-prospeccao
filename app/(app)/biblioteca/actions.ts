"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isTestModeActive } from "@/lib/test-mode";
import type { ContentChannel, ContentType } from "@/types/content";

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

export async function createContent(formData: FormData) {
  const { supabase, userId } = await requireUser();

  const title = str(formData, "title");
  if (!title) throw new Error("Título é obrigatório.");

  const { error } = await supabase.from("content").insert({
    type: (str(formData, "type") as ContentType | null) ?? "script",
    category: str(formData, "category"),
    title,
    description: str(formData, "description"),
    body: str(formData, "body"),
    external_url: str(formData, "external_url"),
    channel: (str(formData, "channel") as ContentChannel | null) ?? null,
    author_user_id: userId,
    is_test: await isTestModeActive(),
    created_by: userId,
    updated_by: userId,
  });

  if (error) throw error;
  revalidatePath("/biblioteca");
}

export async function updateContent(contentId: string, formData: FormData) {
  const { supabase, userId } = await requireUser();

  const title = str(formData, "title");
  if (!title) throw new Error("Título é obrigatório.");

  const { data: current, error: currentError } = await supabase
    .from("content")
    .select("version")
    .eq("id", contentId)
    .single();
  if (currentError) throw currentError;

  const { error } = await supabase
    .from("content")
    .update({
      category: str(formData, "category"),
      title,
      description: str(formData, "description"),
      body: str(formData, "body"),
      external_url: str(formData, "external_url"),
      channel: (str(formData, "channel") as ContentChannel | null) ?? null,
      version: (current?.version ?? 1) + 1,
      updated_by: userId,
    })
    .eq("id", contentId);

  if (error) throw error;
  revalidatePath("/biblioteca");
}

export async function archiveContent(contentId: string) {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("content")
    .update({ status: "archived", updated_by: userId })
    .eq("id", contentId);
  if (error) throw error;
  revalidatePath("/biblioteca");
}
