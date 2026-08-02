import { createClient } from "@/lib/supabase/server";
import { isTestModeActive } from "@/lib/test-mode";
import type { CampaignListItem, CampaignStatus } from "@/types/campaigns";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getCampaigns(params: { status?: CampaignStatus }) {
  const supabase = await createClient();

  let query = supabase
    .from("campaigns")
    .select("*, owner:users!campaigns_owner_user_id_fkey(name)")
    .eq("is_test", await isTestModeActive())
    .order("created_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  } else {
    query = query.neq("status", "archived");
  }

  const { data, error } = await query;
  if (error) throw error;

  const campaignIds = (data ?? []).map((c) => c.id);
  const countsByCampaign = new Map<string, { total: number; active: number; closed: number }>();

  if (campaignIds.length) {
    const { data: links, error: linksError } = await supabase
      .from("lead_campaigns")
      .select("campaign_id, is_active")
      .in("campaign_id", campaignIds);
    if (linksError) throw linksError;

    for (const link of links ?? []) {
      const current = countsByCampaign.get(link.campaign_id) ?? { total: 0, active: 0, closed: 0 };
      current.total += 1;
      if (link.is_active) current.active += 1;
      else current.closed += 1;
      countsByCampaign.set(link.campaign_id, current);
    }
  }

  const campaigns: CampaignListItem[] = (data ?? []).map((row) => {
    const owner = one(row.owner);
    const counts = countsByCampaign.get(row.id) ?? { total: 0, active: 0, closed: 0 };
    return {
      ...row,
      owner_user_name: owner?.name ?? null,
      total_leads: counts.total,
      active_leads: counts.active,
      closed_leads: counts.closed,
    };
  });

  return campaigns;
}

export async function getCampaignDetail(campaignId: string) {
  const supabase = await createClient();

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select(
      `*, owner:users!campaigns_owner_user_id_fkey(name),
       cadence:cadences(id, name, description, channel,
         cadence_steps(id, name, step_order, action_type, interval_days, is_required, is_closing_step)),
       lead_campaigns(id, status, priority, entered_at, closed_at, is_active,
         assigned_user:users(name),
         lead:leads(id, name, trade_name, city, state, general_status))`,
    )
    .eq("id", campaignId)
    .eq("is_test", await isTestModeActive())
    .single();

  if (error) throw error;
  return campaign;
}

export type CadenceTemplateOption = {
  id: string;
  name: string;
  description: string | null;
  channel: string | null;
  step_count: number;
};

export async function getCadenceTemplateOptions(): Promise<CadenceTemplateOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cadences")
    .select("id, name, description, channel, cadence_steps(count)")
    .eq("is_template", true)
    .eq("status", "active")
    .eq("is_test", await isTestModeActive())
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    channel: row.channel,
    step_count: (row.cadence_steps?.[0] as { count: number } | undefined)?.count ?? 0,
  }));
}
