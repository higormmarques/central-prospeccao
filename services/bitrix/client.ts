import "server-only";

/**
 * Cliente do webhook do Bitrix24. Uso exclusivo em código de servidor
 * (Server Actions, Route Handlers) — o import "server-only" quebra o build
 * se este módulo acabar sendo importado por engano em um Client Component.
 *
 * BITRIX_WEBHOOK_URL nunca deve ser logada, retornada ao cliente ou
 * incluída em mensagens de erro. Ver docs/12 (Integração Bitrix), seção 10.
 */

class BitrixError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "BitrixError";
  }
}

function getWebhookUrl(): string {
  const url = process.env.BITRIX_WEBHOOK_URL;
  if (!url) {
    throw new BitrixError("BITRIX_WEBHOOK_URL não configurada no ambiente do servidor.");
  }
  return url.endsWith("/") ? url : `${url}/`;
}

async function callMethod<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  const base = getWebhookUrl();

  let response: Response;
  try {
    response = await fetch(`${base}${method}.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      cache: "no-store",
    });
  } catch {
    throw new BitrixError("Não foi possível conectar ao Bitrix (timeout ou indisponibilidade).");
  }

  const body = await response.json().catch(() => null);

  if (!response.ok || !body || body.error) {
    const description = body?.error_description || `HTTP ${response.status}`;
    throw new BitrixError(`Bitrix retornou erro ao chamar ${method}: ${description}`, body?.error);
  }

  return body.result as T;
}

export type BitrixDeal = {
  ID: string;
  TITLE: string;
  CATEGORY_ID: string;
  STAGE_ID: string;
  OPPORTUNITY: string;
  ASSIGNED_BY_ID: string;
  [key: string]: unknown;
};

/** Consulta um único negócio pelo ID. Somente leitura. */
export async function getDeal(dealId: string | number): Promise<BitrixDeal> {
  return callMethod<BitrixDeal>("crm.deal.get", { id: dealId });
}

/** Lista os campos disponíveis (padrão + personalizados) de negócios. Somente leitura. */
export async function listDealFields(): Promise<Record<string, unknown>> {
  return callMethod<Record<string, unknown>>("crm.deal.fields");
}

export { BitrixError };
