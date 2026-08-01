"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";
import type { Lead, LeadGeneralStatus, Priority, PersonType } from "@/types/leads";

export type LeadDetail = Lead & {
  assigned_user: { name: string } | null;
  lead_contacts: Array<{
    id: string;
    is_primary: boolean;
    receives_whatsapp: boolean;
    receives_email: boolean;
    relationship_type: string | null;
    contact: {
      id: string;
      name: string;
      job_title: string | null;
      phone: string | null;
      phone_normalized: string | null;
      whatsapp_number: string | null;
      email: string | null;
    };
  }>;
  interactions: Array<{
    id: string;
    channel: string;
    interaction_type: string;
    direction: string;
    description: string | null;
    result: string | null;
    occurred_at: string;
    user: { name: string } | null;
  }>;
};

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

export async function createLead(formData: FormData) {
  const { supabase, userId } = await requireUser();

  const name = str(formData, "name");
  if (!name) throw new Error("Nome do lead é obrigatório.");

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      name,
      trade_name: str(formData, "trade_name"),
      person_type: (str(formData, "person_type") as PersonType | null) ?? null,
      city: str(formData, "city"),
      state: str(formData, "state"),
      source: str(formData, "source"),
      priority: (str(formData, "priority") as Priority | null) ?? "media",
      notes: str(formData, "notes"),
      assigned_user_id: userId,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (error) throw error;

  const contactName = str(formData, "contact_name");
  if (contactName) {
    await createContactForLead(lead.id, {
      name: contactName,
      phone: str(formData, "contact_phone"),
      email: str(formData, "contact_email"),
    });
  }

  revalidatePath("/leads");
  return { id: lead.id as string };
}

export async function updateLead(leadId: string, formData: FormData) {
  const { supabase, userId } = await requireUser();

  const name = str(formData, "name");
  if (!name) throw new Error("Nome do lead é obrigatório.");

  const { error } = await supabase
    .from("leads")
    .update({
      name,
      trade_name: str(formData, "trade_name"),
      person_type: (str(formData, "person_type") as PersonType | null) ?? null,
      city: str(formData, "city"),
      state: str(formData, "state"),
      source: str(formData, "source"),
      priority: (str(formData, "priority") as Priority | null) ?? "media",
      notes: str(formData, "notes"),
      updated_by: userId,
    })
    .eq("id", leadId);

  if (error) throw error;

  revalidatePath("/leads");
}

export async function setLeadStatus(leadId: string, status: LeadGeneralStatus) {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("leads")
    .update({ general_status: status, updated_by: userId })
    .eq("id", leadId);
  if (error) throw error;
  revalidatePath("/leads");
}

async function createContactForLead(
  leadId: string,
  input: { name: string; phone: string | null; email: string | null },
) {
  const { supabase, userId } = await requireUser();

  const phoneNormalized = input.phone ? normalizePhone(input.phone) : null;

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .insert({
      name: input.name,
      phone: input.phone,
      phone_normalized: phoneNormalized,
      whatsapp_number: phoneNormalized,
      email: input.email,
      preferred_channel: phoneNormalized ? "whatsapp" : input.email ? "email" : null,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (contactError) throw contactError;

  const { count: existingPrimaryCount } = await supabase
    .from("lead_contacts")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", leadId)
    .eq("is_primary", true);

  const { error: linkError } = await supabase.from("lead_contacts").insert({
    lead_id: leadId,
    contact_id: contact.id,
    is_primary: !existingPrimaryCount,
  });

  if (linkError) {
    // desfaz o contato criado para nao deixar registro orfao sem vinculo
    await supabase.from("contacts").delete().eq("id", contact.id);
    throw linkError;
  }

  return contact.id as string;
}

export async function addContactToLead(leadId: string, formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("Nome do contato é obrigatório.");

  await createContactForLead(leadId, {
    name,
    phone: str(formData, "phone"),
    email: str(formData, "email"),
  });

  revalidatePath("/leads");
}

export async function setPrimaryContact(leadId: string, leadContactId: string) {
  const { supabase } = await requireUser();

  const { error: clearError } = await supabase
    .from("lead_contacts")
    .update({ is_primary: false })
    .eq("lead_id", leadId);
  if (clearError) throw clearError;

  const { error: setError } = await supabase
    .from("lead_contacts")
    .update({ is_primary: true })
    .eq("id", leadContactId);
  if (setError) throw setError;

  revalidatePath("/leads");
}

export async function getLeadDetail(leadId: string): Promise<LeadDetail> {
  const { supabase } = await requireUser();

  const { data: lead, error } = await supabase
    .from("leads")
    .select(
      `*, assigned_user:users!leads_assigned_user_id_fkey(name),
       lead_contacts(id, is_primary, receives_whatsapp, receives_email, relationship_type,
         contact:contacts(id, name, job_title, phone, phone_normalized, whatsapp_number, email)),
       interactions(id, channel, interaction_type, direction, description, result, occurred_at,
         user:users(name))`,
    )
    .eq("id", leadId)
    .order("occurred_at", { referencedTable: "interactions", ascending: false })
    .single();

  if (error) throw error;
  return lead as unknown as LeadDetail;
}
