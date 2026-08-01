"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/feedback/empty-state";
import { CadenceTemplateDialog } from "@/components/settings/cadence-template-dialog";
import {
  addTemplateCadenceStep,
  deleteTemplateCadenceStep,
  toggleCadenceTemplateStatus,
} from "@/app/(app)/configuracoes/actions";
import type { CadenceTemplate } from "@/app/(app)/configuracoes/queries";

const ACTION_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  ligacao: "Ligação",
  email: "E-mail",
  reuniao: "Reunião",
  encerramento: "Encerramento",
  outro: "Outro",
};

function TemplateStepsEditor({ template }: { template: CadenceTemplate }) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleAddStep(formData: FormData) {
    startTransition(async () => {
      try {
        await addTemplateCadenceStep(template.id, formData);
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
        await deleteTemplateCadenceStep(stepId);
        toast.success("Etapa removida.");
        router.refresh();
      } catch {
        toast.error("Não foi possível remover a etapa.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 border-t p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground">Etapas do modelo</h4>
        <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-3.5 w-3.5" /> Adicionar etapa
        </Button>
      </div>

      {template.steps.length === 0 && !showForm ? (
        <EmptyState title="Nenhuma etapa cadastrada" description="Adicione a primeira etapa deste modelo." />
      ) : (
        <ol className="flex flex-col gap-2">
          {template.steps.map((step) => (
            <li key={step.id} className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm">
              <div>
                <p className="font-medium">
                  {step.step_order}. {step.name}
                  {step.is_closing_step && <span className="ml-2 text-xs text-muted-foreground">(encerramento)</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ACTION_LABEL[step.action_type] ?? step.action_type} · intervalo de {step.interval_days}{" "}
                  {step.interval_days === 1 ? "dia" : "dias"}
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" disabled={isPending} onClick={() => handleDeleteStep(step.id)}>
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
              <Label htmlFor={`step_name_${template.id}`}>Nome da etapa</Label>
              <Input id={`step_name_${template.id}`} name="name" required placeholder="Follow-up 1" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`action_type_${template.id}`}>Canal</Label>
              <select
                id={`action_type_${template.id}`}
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
              <Label htmlFor={`interval_days_${template.id}`}>Intervalo (dias)</Label>
              <Input id={`interval_days_${template.id}`} name="interval_days" type="number" min={0} defaultValue={2} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id={`is_closing_step_${template.id}`} name="is_closing_step" />
            <Label htmlFor={`is_closing_step_${template.id}`} className="font-normal">
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

export function CadenceTemplatesManager({ templates }: { templates: CadenceTemplate[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggleStatus(template: CadenceTemplate) {
    startTransition(async () => {
      try {
        await toggleCadenceTemplateStatus(template.id, template.status === "active" ? "inactive" : "active");
        toast.success(template.status === "active" ? "Modelo desativado." : "Modelo ativado.");
        router.refresh();
      } catch {
        toast.error("Não foi possível atualizar o modelo.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <CadenceTemplateDialog />
      </div>

      {templates.length === 0 ? (
        <EmptyState
          title="Nenhum modelo de cadência cadastrado"
          description="Crie modelos reutilizáveis de abordagem, follow-up e encerramento para aplicar em campanhas."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {templates.map((template) => {
            const isExpanded = expandedId === template.id;
            return (
              <li key={template.id} className="rounded-lg border">
                <div className="flex items-center justify-between gap-2 p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {template.name}
                      {template.status === "inactive" && (
                        <Badge variant="outline" className="ml-2">
                          inativo
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {template.channel ? `${template.channel} · ` : ""}
                      {template.steps.length} {template.steps.length === 1 ? "etapa" : "etapas"}
                    </p>
                    {template.description && (
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" disabled={isPending} onClick={() => handleToggleStatus(template)}>
                      {template.status === "active" ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : template.id)}
                    >
                      Etapas
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
                {isExpanded && <TemplateStepsEditor template={template} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
