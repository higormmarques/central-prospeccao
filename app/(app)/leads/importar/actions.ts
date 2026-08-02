"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";
import { linkLeadToCampaign } from "@/lib/cadence";
import { isTestModeActive } from "@/lib/test-mode";
import type { ColumnMapping, LeadField, RowStatus, ValidatedRow } from "@/types/imports";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  return { supabase, userId: user.id };
}

function extractValues(row: string[], mapping: ColumnMapping): Partial<Record<LeadField, string>> {
  const values: Partial<Record<LeadField, string>> = {};
  for (const [indexStr, field] of Object.entries(mapping)) {
    if (field === "ignore") continue;
    const value = row[Number(indexStr)]?.trim();
    if (value) values[field as LeadField] = value;
  }
  return values;
}

export async function validateImportRows(rawRows: string[][], mapping: ColumnMapping): Promise<ValidatedRow[]> {
  const { supabase } = await requireUser();
  const testMode = await isTestModeActive();

  const { data: existingLeads } = await supabase
    .from("leads")
    .select("name, trade_name, document_number, bitrix_deal_id")
    .eq("is_test", testMode)
    .neq("general_status", "arquivado");

  const { data: existingContacts } = await supabase
    .from("contacts")
    .select("phone_normalized")
    .eq("is_test", testMode);

  const bitrixSet = new Set(
    (existingLeads ?? []).filter((l) => l.bitrix_deal_id != null).map((l) => String(l.bitrix_deal_id)),
  );
  const documentSet = new Set(
    (existingLeads ?? []).filter((l) => l.document_number).map((l) => l.document_number!.trim().toLowerCase()),
  );
  const namePairSet = new Set(
    (existingLeads ?? []).map((l) => `${l.name.trim().toLowerCase()}|${(l.trade_name ?? "").trim().toLowerCase()}`),
  );
  const phoneSet = new Set(
    (existingContacts ?? []).filter((c) => c.phone_normalized).map((c) => c.phone_normalized!),
  );

  const seenInFile = new Set<string>();

  return rawRows.map((row, rowIndex) => {
    const values = extractValues(row, mapping);
    let status: RowStatus = "novo";
    let reason: string | undefined;

    if (!values.name) {
      status = "erro";
      reason = "Nome do lead ausente.";
    } else {
      // Ordem de deduplicacao recomendada pelo doc03 §12: ID do negocio no
      // Bitrix, outro identificador (documento), telefone, nome+empresa.
      const bitrixKey = values.bitrix_deal_id?.trim();
      const docKey = values.document_number?.trim().toLowerCase();
      const phoneKey = values.contact_phone ? normalizePhone(values.contact_phone) : null;
      const namePairKey = `${values.name.trim().toLowerCase()}|${(values.trade_name ?? "").trim().toLowerCase()}`;

      const isDuplicateInDb =
        (bitrixKey && bitrixSet.has(bitrixKey)) ||
        (docKey && documentSet.has(docKey)) ||
        (phoneKey && phoneSet.has(phoneKey)) ||
        namePairSet.has(namePairKey);

      const dedupeKey = bitrixKey || docKey || phoneKey || namePairKey;
      const isDuplicateInFile = seenInFile.has(dedupeKey);
      seenInFile.add(dedupeKey);

      if (isDuplicateInDb) {
        status = "duplicado";
        reason = "Já existe um lead com o mesmo ID do Bitrix, documento, telefone ou nome+empresa.";
      } else if (isDuplicateInFile) {
        status = "duplicado";
        reason = "Duplicado dentro do próprio arquivo.";
      }
    }

    return { rowIndex, status, reason, values };
  });
}

const ROW_STATUS_TO_DB: Record<RowStatus, string> = {
  novo: "new",
  duplicado: "duplicate",
  erro: "error",
};

export async function confirmImport(params: {
  fileName: string;
  campaignId: string | null;
  source: string;
  rows: ValidatedRow[];
}) {
  const { supabase, userId } = await requireUser();
  const { fileName, campaignId, source, rows } = params;
  const testMode = await isTestModeActive();

  const counts = {
    total: rows.length,
    novos: rows.filter((r) => r.status === "novo").length,
    duplicados: rows.filter((r) => r.status === "duplicado").length,
    erros: rows.filter((r) => r.status === "erro").length,
  };

  const { data: importRow, error: importError } = await supabase
    .from("imports")
    .insert({
      file_name: fileName,
      campaign_id: campaignId,
      user_id: userId,
      source,
      total_rows: counts.total,
      new_records: counts.novos,
      duplicate_records: counts.duplicados,
      error_records: counts.erros,
      status: "processing",
      is_test: testMode,
    })
    .select("id")
    .single();
  if (importError) throw importError;

  for (const row of rows) {
    let leadId: string | null = null;

    if (row.status === "novo") {
      const bitrixDealId = row.values.bitrix_deal_id ? Number(row.values.bitrix_deal_id) : null;

      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .insert({
          name: row.values.name,
          trade_name: row.values.trade_name ?? null,
          legal_name: row.values.legal_name ?? null,
          city: row.values.city ?? null,
          state: row.values.state ?? null,
          source: row.values.source ?? source,
          document_number: row.values.document_number ?? null,
          bitrix_deal_id: Number.isFinite(bitrixDealId) ? bitrixDealId : null,
          bitrix_url: row.values.bitrix_url ?? null,
          assigned_user_id: userId,
          is_test: testMode,
          created_by: userId,
          updated_by: userId,
        })
        .select("id")
        .single();

      if (leadError) throw leadError;
      leadId = lead.id;

      if (row.values.contact_name || row.values.contact_phone || row.values.contact_email) {
        const phoneNormalized = row.values.contact_phone ? normalizePhone(row.values.contact_phone) : null;
        const { data: contact, error: contactError } = await supabase
          .from("contacts")
          .insert({
            name: row.values.contact_name ?? row.values.name!,
            job_title: row.values.contact_role ?? null,
            phone: row.values.contact_phone ?? null,
            phone_normalized: phoneNormalized,
            whatsapp_number: phoneNormalized,
            email: row.values.contact_email ?? null,
            is_test: testMode,
            created_by: userId,
            updated_by: userId,
          })
          .select("id")
          .single();
        if (contactError) throw contactError;

        await supabase.from("lead_contacts").insert({
          lead_id: leadId,
          contact_id: contact.id,
          is_primary: true,
        });
      }

      if (leadId && campaignId) {
        await linkLeadToCampaign(supabase, { leadId, campaignId, userId });
      }
    }

    await supabase.from("import_rows").insert({
      import_id: importRow.id,
      row_number: row.rowIndex + 1,
      lead_id: leadId,
      status: ROW_STATUS_TO_DB[row.status],
      error_message: row.reason ?? null,
      raw_data: row.values,
    });
  }

  await supabase
    .from("imports")
    .update({ status: "completed", finished_at: new Date().toISOString() })
    .eq("id", importRow.id);

  revalidatePath("/leads");
  revalidatePath("/leads/importar");
  revalidatePath("/operacao");

  return { importId: importRow.id as string, ...counts };
}
