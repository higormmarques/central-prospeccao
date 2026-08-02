import { createClient } from "@/lib/supabase/server";
import { todayIso } from "@/lib/cadence";
import { isTestModeActive } from "@/lib/test-mode";
import type { CampaignSummary, ClosingReasonCount, OperationalKpis } from "@/types/reports";

const RESPONDED_RESULTS = ["respondeu", "pediu_retorno", "reuniao_marcada", "negociacao"];

function periodStartIso(periodDays: number | null): string | null {
  if (!periodDays) return null;
  const date = new Date();
  date.setDate(date.getDate() - periodDays);
  return date.toISOString();
}

export async function getOperationalKpis(periodDays: number | null): Promise<OperationalKpis> {
  const supabase = await createClient();
  const from = periodStartIso(periodDays);
  const today = todayIso();
  const testMode = await isTestModeActive();

  const { count: totalLeads } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("is_test", testMode)
    .neq("general_status", "arquivado");

  const { count: activeLeads } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("is_test", testMode)
    .eq("general_status", "ativo");

  let tasksQuery = supabase
    .from("tasks")
    .select("id, lead:leads!inner(is_test)", { count: "exact", head: true })
    .eq("status", "concluida")
    .eq("lead.is_test", testMode);
  if (from) tasksQuery = tasksQuery.gte("completed_at", from);
  const { count: tasksCompleted } = await tasksQuery;

  const { count: overdueTasks } = await supabase
    .from("tasks")
    .select("id, lead:leads!inner(is_test)", { count: "exact", head: true })
    .eq("status", "pendente")
    .eq("lead.is_test", testMode)
    .lt("scheduled_date", today);

  let interactionsQuery = supabase
    .from("interactions")
    .select("result, lead:leads!inner(is_test)")
    .eq("lead.is_test", testMode);
  if (from) interactionsQuery = interactionsQuery.gte("occurred_at", from);
  const { data: interactions, error: interactionsError } = await interactionsQuery;
  if (interactionsError) throw interactionsError;

  const interactionsCount = interactions?.length ?? 0;
  const respondedCount = (interactions ?? []).filter(
    (i) => i.result && RESPONDED_RESULTS.includes(i.result),
  ).length;
  const responseRate = interactionsCount > 0 ? Math.round((respondedCount / interactionsCount) * 100) : 0;

  return {
    totalLeads: totalLeads ?? 0,
    activeLeads: activeLeads ?? 0,
    tasksCompleted: tasksCompleted ?? 0,
    overdueTasks: overdueTasks ?? 0,
    interactionsCount,
    responseRate,
  };
}

export async function getCampaignSummaries(): Promise<CampaignSummary[]> {
  const supabase = await createClient();

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("id, name, status")
    .eq("is_test", await isTestModeActive())
    .order("created_at", { ascending: false });
  if (error) throw error;

  const ids = (campaigns ?? []).map((c) => c.id);
  const counts = new Map<string, { total: number; active: number; closed: number }>();

  if (ids.length) {
    const { data: links, error: linksError } = await supabase
      .from("lead_campaigns")
      .select("campaign_id, is_active")
      .in("campaign_id", ids);
    if (linksError) throw linksError;

    for (const link of links ?? []) {
      const current = counts.get(link.campaign_id) ?? { total: 0, active: 0, closed: 0 };
      current.total += 1;
      if (link.is_active) current.active += 1;
      else current.closed += 1;
      counts.set(link.campaign_id, current);
    }
  }

  return (campaigns ?? []).map((c) => {
    const count = counts.get(c.id) ?? { total: 0, active: 0, closed: 0 };
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      totalLeads: count.total,
      activeLeads: count.active,
      closedLeads: count.closed,
    };
  });
}

export async function getClosingReasonBreakdown(periodDays: number | null): Promise<ClosingReasonCount[]> {
  const supabase = await createClient();
  const from = periodStartIso(periodDays);

  let query = supabase
    .from("lead_campaigns")
    .select("closing_reason_id, reason:reasons(name), campaign:campaigns!inner(is_test)")
    .eq("status", "encerrado")
    .eq("campaign.is_test", await isTestModeActive())
    .not("closing_reason_id", "is", null);
  if (from) query = query.gte("closed_at", from);

  const { data, error } = await query;
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const reason = Array.isArray(row.reason) ? row.reason[0] : row.reason;
    const name = reason?.name ?? "Sem motivo";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getLeadsForExport() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("name, trade_name, city, state, general_status, priority, source, created_at")
    .eq("is_test", await isTestModeActive())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
