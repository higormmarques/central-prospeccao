export type PersonType = "PF" | "PJ";
export type LeadGeneralStatus = "novo" | "ativo" | "encerrado" | "arquivado";
export type Priority = "baixa" | "media" | "alta" | "urgente";

export type Lead = {
  id: string;
  name: string;
  trade_name: string | null;
  legal_name: string | null;
  person_type: PersonType | null;
  document_number: string | null;
  source: string | null;
  general_status: LeadGeneralStatus;
  priority: Priority;
  assigned_user_id: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadListItem = Lead & {
  assigned_user_name: string | null;
  primary_contact_name: string | null;
  primary_contact_whatsapp: string | null;
};
