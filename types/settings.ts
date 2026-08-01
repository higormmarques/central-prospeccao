export type Role = {
  id: string;
  name: string;
  description: string | null;
};

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  photo_url: string | null;
  status: "active" | "inactive";
  role_id: string | null;
  role_name: string | null;
  last_access_at: string | null;
  created_at: string;
};

export type ReasonType = "response" | "closing" | "loss" | "reactivation" | "cancellation";

export type Reason = {
  id: string;
  type: ReasonType;
  name: string;
  description: string | null;
  is_active: boolean;
};

export const REASON_TYPE_LABELS: Record<ReasonType, string> = {
  response: "Resposta",
  closing: "Encerramento",
  loss: "Perda",
  reactivation: "Reativação",
  cancellation: "Cancelamento",
};
