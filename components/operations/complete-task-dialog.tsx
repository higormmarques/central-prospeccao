"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { completeTask } from "@/app/(app)/operacao/actions";
import type { TaskQueueItem } from "@/types/operations";

const RESULT_OPTIONS = [
  { value: "sem_resposta", label: "Sem resposta" },
  { value: "respondeu", label: "Respondeu" },
  { value: "pediu_retorno", label: "Pediu retorno" },
  { value: "sem_interesse", label: "Sem interesse" },
  { value: "reuniao_marcada", label: "Reunião marcada" },
  { value: "negociacao", label: "Em negociação" },
  { value: "outro", label: "Outro" },
];

export function CompleteTaskDialog({
  task,
  closingReasons,
}: {
  task: TaskQueueItem;
  closingReasons: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [nextAction, setNextAction] = useState<"continue" | "custom" | "close">(
    task.cadence_step_id ? "continue" : "custom",
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    formData.set("next_action", nextAction);
    startTransition(async () => {
      try {
        await completeTask(task.id, formData);
        toast.success("Interação registrada.");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Não foi possível registrar a interação.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <CheckCircle2 className="h-3.5 w-3.5" />
        Concluir ação
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar interação — {task.lead?.name}</DialogTitle>
          <DialogDescription>
            Toda interação deve ser registrada antes de definir a próxima ação.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="contact_id" value="" />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="channel">Canal</Label>
              <select
                id="channel"
                name="channel"
                defaultValue={task.cadence_step?.action_type ?? "whatsapp"}
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="ligacao">Ligação</option>
                <option value="email">E-mail</option>
                <option value="reuniao">Reunião</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="result">Resultado</Label>
              <select
                id="result"
                name="result"
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                defaultValue="sem_resposta"
              >
                {RESULT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Resumo</Label>
            <Textarea id="description" name="description" rows={2} placeholder="O que aconteceu no contato..." />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Próxima ação</Label>
            <div className="flex flex-col gap-2 rounded-md border p-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="next_action_choice"
                  checked={nextAction === "continue"}
                  disabled={!task.cadence_step_id}
                  onChange={() => setNextAction("continue")}
                />
                Avançar para a próxima etapa da cadência
                {!task.cadence_step_id && (
                  <span className="text-xs text-muted-foreground">(sem cadência vinculada)</span>
                )}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="next_action_choice"
                  checked={nextAction === "custom"}
                  onChange={() => setNextAction("custom")}
                />
                Agendar manualmente
              </label>
              {nextAction === "custom" && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="custom_task_type">Tipo</Label>
                    <select
                      id="custom_task_type"
                      name="custom_task_type"
                      className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                      defaultValue="followup"
                    >
                      <option value="followup">Follow-up</option>
                      <option value="ligacao">Ligação</option>
                      <option value="abordagem">Abordagem</option>
                      <option value="encerramento">Encerramento</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="custom_date">Data</Label>
                    <Input id="custom_date" name="custom_date" type="date" />
                  </div>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="next_action_choice"
                  checked={nextAction === "close"}
                  onChange={() => setNextAction("close")}
                />
                Encerrar participação na campanha
              </label>
              {nextAction === "close" && (
                <div className="pl-6">
                  <select
                    id="closing_reason_id"
                    name="closing_reason_id"
                    className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Selecione o motivo...
                    </option>
                    {closingReasons.map((reason) => (
                      <option key={reason.id} value={reason.id}>
                        {reason.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Registrar e continuar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
