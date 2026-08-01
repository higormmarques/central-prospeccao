export type LeadField =
  | "name"
  | "trade_name"
  | "legal_name"
  | "city"
  | "state"
  | "source"
  | "document_number"
  | "bitrix_deal_id"
  | "bitrix_url"
  | "contact_name"
  | "contact_role"
  | "contact_phone"
  | "contact_email"
  | "ignore";

export const LEAD_FIELD_LABELS: Record<LeadField, string> = {
  name: "Nome do lead (TITLE)",
  trade_name: "Empresa / nome fantasia",
  legal_name: "Razão social",
  city: "Cidade",
  state: "UF",
  source: "Origem",
  document_number: "Documento (CNPJ/CPF)",
  bitrix_deal_id: "ID do negócio no Bitrix (ID)",
  bitrix_url: "Link do negócio no Bitrix",
  contact_name: "Nome do contato",
  contact_role: "Cargo do contato",
  contact_phone: "Telefone do contato",
  contact_email: "E-mail do contato",
  ignore: "Não importar",
};

export type ColumnMapping = Record<number, LeadField>;

export type RowStatus = "novo" | "duplicado" | "erro";

export type ValidatedRow = {
  rowIndex: number;
  status: RowStatus;
  reason?: string;
  values: Partial<Record<LeadField, string>>;
};

export type ImportSummary = {
  total: number;
  novos: number;
  duplicados: number;
  erros: number;
};

export type ImportHistoryItem = {
  id: string;
  file_name: string;
  source: string;
  total_rows: number;
  new_records: number;
  updated_records: number;
  duplicate_records: number;
  error_records: number;
  status: string;
  started_at: string;
  finished_at: string | null;
  user_name: string | null;
  campaign_name: string | null;
};
