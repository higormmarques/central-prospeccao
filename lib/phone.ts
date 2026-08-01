/**
 * Normaliza um telefone para o formato usado em links do WhatsApp:
 * apenas dígitos, com DDI. Assume Brasil (55) quando o DDI não é informado.
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}
