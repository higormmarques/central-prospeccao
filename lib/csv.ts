export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const clean = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') inQuotes = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\r") {
      // ignora, o \n seguinte fecha a linha
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const filtered = rows.filter((r) => r.some((c) => c.trim() !== ""));
  const [headers, ...dataRows] = filtered;
  return { headers: (headers ?? []).map((h) => h.trim()), rows: dataRows };
}

const FIELD_KEYWORDS: Record<string, string[]> = {
  name: ["nome do lead", "nome do cliente", "nome"],
  trade_name: ["empresa", "clinica", "clínica", "consultorio", "consultório", "razao social", "razão social"],
  document_number: ["cnpj", "cpf", "documento", "id do negocio", "id do negócio", "id"],
  city: ["cidade"],
  state: ["uf", "estado"],
  source: ["origem"],
  contact_name: ["contato", "responsavel", "responsável"],
  contact_phone: ["telefone", "celular", "whatsapp", "fone"],
  contact_email: ["email", "e-mail"],
};

const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(DIACRITICS, "").trim();
}

/**
 * Palavras-chave de uma só palavra (ex.: "id") precisam bater com um token
 * inteiro do cabeçalho, não como substring — senão "id" combina dentro de
 * "cidade". Frases de várias palavras (ex.: "id do negócio") são longas o
 * bastante para continuar usando substring com segurança.
 */
function matchesKeyword(normalizedHeader: string, keyword: string): boolean {
  if (keyword.includes(" ")) return normalizedHeader.includes(keyword);
  const compact = normalizedHeader.replace(/[^a-z0-9]/g, "");
  if (compact === keyword) return true;
  const tokens = normalizedHeader.split(/[^a-z0-9]+/).filter(Boolean);
  return tokens.includes(keyword);
}

export function guessMapping(headers: string[]): Record<number, string> {
  const mapping: Record<number, string> = {};
  headers.forEach((header, index) => {
    const normalized = normalize(header);
    for (const [field, keywords] of Object.entries(FIELD_KEYWORDS)) {
      if (keywords.some((k) => matchesKeyword(normalized, k))) {
        mapping[index] = field;
        break;
      }
    }
  });
  return mapping;
}
