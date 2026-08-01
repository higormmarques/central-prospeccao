import { createClient } from "@/lib/supabase/server";
import type { ImportHistoryItem } from "@/types/imports";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getImportHistory(): Promise<ImportHistoryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("imports")
    .select("*, user:users(name), campaign:campaigns(name)")
    .order("started_at", { ascending: false })
    .limit(20);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...row,
    user_name: one(row.user)?.name ?? null,
    campaign_name: one(row.campaign)?.name ?? null,
  }));
}

export async function getCampaignOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, name")
    .neq("status", "archived")
    .order("name");
  if (error) throw error;
  return data ?? [];
}
