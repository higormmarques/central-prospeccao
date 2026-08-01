import { createClient } from "@/lib/supabase/server";
import { todayIso } from "@/lib/cadence";
import type { TaskQueueItem } from "@/types/operations";

type RawContactLink = { is_primary: boolean; contact: { name: string; whatsapp_number: string | null; phone_normalized: string | null } };

type RawTaskRow = {
  id: string;
  task_type: TaskQueueItem["task_type"];
  priority: TaskQueueItem["priority"];
  scheduled_date: string;
  scheduled_time: string | null;
  lead_id: string;
  lead_campaign_id: string | null;
  cadence_step_id: string | null;
  lead: {
    id: string;
    name: string;
    trade_name: string | null;
    city: string | null;
    state: string | null;
    lead_contacts: RawContactLink[];
  } | null;
  lead_campaign: { id: string; status: string; campaign: { id: string; name: string } | null } | null;
  cadence_step: { id: string; name: string; action_type: string; cadence_id: string; step_order: number } | null;
};

export async function getQueue() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { atrasadas: [], hoje: [], proximas: [], totalConcluidasHoje: 0 };

  const { data, error } = await supabase
    .from("tasks")
    .select(
      `id, task_type, priority, scheduled_date, scheduled_time, lead_id, lead_campaign_id, cadence_step_id,
       lead:leads(id, name, trade_name, city, state,
         lead_contacts(is_primary, contact:contacts(name, whatsapp_number, phone_normalized))),
       lead_campaign:lead_campaigns(id, status, campaign:campaigns(id, name)),
       cadence_step:cadence_steps(id, name, action_type, cadence_id, step_order)`,
    )
    .eq("assigned_user_id", user.id)
    .eq("status", "pendente")
    .order("scheduled_date", { ascending: true });

  if (error) throw error;

  const today = todayIso();
  const rows = (data ?? []) as unknown as RawTaskRow[];

  const items: TaskQueueItem[] = rows.map((row) => {
    const primary = row.lead?.lead_contacts?.find((lc) => lc.is_primary)?.contact ?? null;
    return {
      id: row.id,
      task_type: row.task_type,
      priority: row.priority,
      scheduled_date: row.scheduled_date,
      scheduled_time: row.scheduled_time,
      lead_id: row.lead_id,
      lead_campaign_id: row.lead_campaign_id,
      cadence_step_id: row.cadence_step_id,
      lead: row.lead
        ? { id: row.lead.id, name: row.lead.name, trade_name: row.lead.trade_name, city: row.lead.city, state: row.lead.state }
        : null,
      lead_campaign: row.lead_campaign,
      cadence_step: row.cadence_step,
      primary_contact: primary,
    };
  });

  const { count: totalConcluidasHoje } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("assigned_user_id", user.id)
    .eq("status", "concluida")
    .gte("completed_at", `${today}T00:00:00`)
    .lte("completed_at", `${today}T23:59:59`);

  return {
    atrasadas: items.filter((t) => t.scheduled_date < today),
    hoje: items.filter((t) => t.scheduled_date === today),
    proximas: items.filter((t) => t.scheduled_date > today),
    totalConcluidasHoje: totalConcluidasHoje ?? 0,
  };
}

export async function getClosingReasons() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reasons")
    .select("id, name")
    .eq("type", "closing")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}
