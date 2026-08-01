import type { TaskType } from "@/types/operations";

/**
 * tasks.task_type (natureza da tarefa no funil) e cadence_steps.action_type
 * (canal da etapa) são domínios diferentes — esta função faz a ponte.
 */
export function mapStepToTaskType(step: {
  step_order: number;
  action_type: string;
  is_closing_step: boolean;
}): TaskType {
  if (step.is_closing_step) return "encerramento";
  if (step.step_order === 1) return "abordagem";
  if (step.action_type === "ligacao") return "ligacao";
  return "followup";
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
