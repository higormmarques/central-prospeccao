export type CadenceActionType = "whatsapp" | "ligacao" | "email" | "reuniao" | "encerramento" | "outro";

export type Cadence = {
  id: string;
  name: string;
  description: string | null;
  channel: string | null;
  status: "active" | "inactive";
  is_template: boolean;
};

export type CadenceStep = {
  id: string;
  cadence_id: string;
  name: string;
  step_order: number;
  action_type: CadenceActionType;
  interval_days: number;
  content_id: string | null;
  is_required: boolean;
  is_closing_step: boolean;
  next_step_id: string | null;
};
