import { createClient } from "@/lib/supabase/server";
import type { LeadGeneralStatus, LeadListItem } from "@/types/leads";

export const PAGE_SIZE = 20;

/** PostgREST embeds a to-one relation as an object, but the untyped client
 * (sem `supabase gen types`) infere como array. Normaliza os dois casos. */
function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getLeads(params: { q?: string; status?: LeadGeneralStatus; page?: number }) {
  const supabase = await createClient();
  const page = params.page && params.page > 0 ? params.page : 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("leads")
    .select(
      `id, name, trade_name, legal_name, person_type, document_number, source,
       general_status, priority, assigned_user_id, city, state, notes,
       bitrix_deal_id, bitrix_url,
       created_at, updated_at,
       assigned_user:users!leads_assigned_user_id_fkey(name),
       lead_contacts(is_primary, contact:contacts(name, whatsapp_number, phone_normalized))`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.status) {
    query = query.eq("general_status", params.status);
  } else {
    query = query.neq("general_status", "arquivado");
  }

  if (params.q) {
    const term = params.q.trim();
    if (term) {
      query = query.or(`name.ilike.%${term}%,trade_name.ilike.%${term}%,document_number.ilike.%${term}%`);
    }
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const leads: LeadListItem[] = (data ?? []).map((row) => {
    const primaryLink = row.lead_contacts?.find((lc: { is_primary: boolean }) => lc.is_primary);
    const primary = one(primaryLink?.contact);
    const assignedUser = one(row.assigned_user);
    return {
      ...row,
      assigned_user_name: assignedUser?.name ?? null,
      primary_contact_name: primary?.name ?? null,
      primary_contact_whatsapp: primary?.whatsapp_number ?? primary?.phone_normalized ?? null,
    };
  });

  return { leads, total: count ?? 0, page, pageSize: PAGE_SIZE };
}

export async function getLeadCounts() {
  const supabase = await createClient();
  const { count: total } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .neq("general_status", "arquivado");
  const { count: ativos } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("general_status", "ativo");
  const { count: encerrados } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("general_status", "encerrado");

  return { total: total ?? 0, ativos: ativos ?? 0, encerrados: encerrados ?? 0 };
}
