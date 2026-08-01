"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";

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

export async function createContact(formData: FormData) {
  const { supabase, userId } = await requireUser();

  const name = str(formData, "name");
  if (!name) throw new Error("Nome do contato é obrigatório.");

  const phone = str(formData, "phone");
  const phoneNormalized = phone ? normalizePhone(phone) : null;

  const { error } = await supabase.from("contacts").insert({
    name,
    job_title: str(formData, "job_title"),
    phone,
    phone_normalized: phoneNormalized,
    whatsapp_number: phoneNormalized,
    email: str(formData, "email"),
    city: str(formData, "city"),
    state: str(formData, "state"),
    notes: str(formData, "notes"),
    created_by: userId,
    updated_by: userId,
  });

  if (error) throw error;
  revalidatePath("/contatos");
}

export async function updateContact(contactId: string, formData: FormData) {
  const { supabase, userId } = await requireUser();

  const name = str(formData, "name");
  if (!name) throw new Error("Nome do contato é obrigatório.");

  const phone = str(formData, "phone");
  const phoneNormalized = phone ? normalizePhone(phone) : null;

  const { error } = await supabase
    .from("contacts")
    .update({
      name,
      job_title: str(formData, "job_title"),
      phone,
      phone_normalized: phoneNormalized,
      whatsapp_number: phoneNormalized,
      email: str(formData, "email"),
      city: str(formData, "city"),
      state: str(formData, "state"),
      notes: str(formData, "notes"),
      updated_by: userId,
    })
    .eq("id", contactId);

  if (error) throw error;
  revalidatePath("/contatos");
}
