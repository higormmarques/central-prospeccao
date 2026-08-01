import { normalizePhone } from "@/lib/phone";

/**
 * Gera o link de abertura de conversa no WhatsApp (sem automações).
 * Retorna null quando não há telefone válido.
 */
export function buildWhatsAppLink(phoneNormalized: string | null | undefined, message?: string) {
  if (!phoneNormalized) return null;
  const digits = normalizePhone(phoneNormalized);
  if (!digits) return null;

  const url = new URL(`https://wa.me/${digits}`);
  if (message) url.searchParams.set("text", message);
  return url.toString();
}
