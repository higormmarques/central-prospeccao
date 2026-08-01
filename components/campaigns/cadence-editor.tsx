"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/feedback/empty-state";
import {
  addCadenceStep,
  createCadenceForCampaign,
  deleteCadenceStep,
} from "@/app/(app)/campanhas/actions";
import type { CadenceStep } from "@/types/cadences";

const ACTION_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  ligacao: "Ligação",
  email: "E-mail",
  reuniao: "Reunião",
  encerramento: "Encerramento",
  outro: "Outro",
};

export function CadenceEditor({
  campaignId,
  campaignName,
  cadence,
}: {
  campaignId: string;
  campaignName: string;
  cadence: { id: string; name: string; steps: CadenceStep[] } | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleCreateCadence() {
    startTransition(async () => {
      try {
        await createCadenceForCampaign(campaignId, `Cadência — ${campaignName}`.slice(0, 60));
        toast.success("Cadência criada.");
        router.refresh();
      } catch {
        toast.error("Não foi possível criar a cadência.");
      }
    });
  }

  function handleAddStep(formData: FormData) {
    if (!cadence) return;
    startTransition(async () => {
      try {
        await addCadenceStep(cadence.id, campaignId, formData);
        toast.success("Etapa adicionada.");
        formRef.current?.reset();
        setShowForm(false);
        router.refresh();
      } catch {
        toast.error("Não foi possível adicionar a etapa.");
      }
    });
  }

  function handleDeleteStep(stepId: string) {
    startTransition(async () => {
      try {
        await deleteCadenceStep(stepId, campaignId);
        toast.success("Etapa removida.");
        router.refresh();
      } catch {
        toast.error("Não foi possível remover a etapa.");
      }
    });
  }

  if (!cadence) {
    return (
      <EmptyState
        title="Nenhuma cadência vinculada"
        description="Crie uma cadência para definir abordagem, follow-ups e encerramento desta campanha."
        action={
          <Button size="sm" disabled={isPending} onClick={handleCreateCadence}>
            Criar cadência
          </Button>
        }
      />
    );
  }

  const steps = [...cadence.steps].sort((a, b) => a.step_order - b.step_order);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{cadence.name}</h3>
        <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-3.5 w-3.5" /> Adicionar etapa
        </Button>
      </div>

      {steps.length === 0 && !showForm ? (
        <EmptyState title="Nenhuma etapa cadastrada" description="Adicione a primeira etapa da cadência." />
      ) : (
        <ol className="flex flex-col gap-2">
          {steps.map((step) => (
            <li
              key={step.id}
              className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm"
            >
              <div>
                <p className="font-medium">
                  {step.step_order}. {step.name}
                  {step.is_closing_step && (
                    <span className="ml-2 text-xs text-muted-foreground">(encerramento)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ACTION_LABEL[step.action_type] ?? step.action_type} · intervalo de {step.interval_days}{" "}
                  {step.interval_days === 1 ? "dia" : "dias"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={isPending}
                onClick={() => handleDeleteStep(step.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ol>
      )}

      {showForm && (
        <form ref={formRef} action={handleAddStep} className="flex flex-col gap-3 rounded-md border p-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="step_name">Nome da etapa</Label>
              <Input id="step_name" name="name" required placeholder="Follow-up 1" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="action_type">Canal</Label>
              <select
                id="action_type"
                name="action_type"
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                defaultValue="whatsapp"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="ligacao">Ligação</option>
                <option value="email">E-mail</option>
                <option value="reuniao">Reunião</option>
                <option value="encerramento">Encerramento</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="interval_days">Intervalo (dias)</Label>
              <Input id="interval_days" name="interval_days" type="number" min={0} defaultValue={2} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="is_closing_step" name="is_closing_step" />
            <Label htmlFor="is_closing_step" className="font-normal">
              Esta etapa encerra a cadência
            </Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              Salvar etapa
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
