"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTemplateForCampaign } from "@/app/(app)/campanhas/actions";
import type { CadenceTemplateOption } from "@/app/(app)/campanhas/queries";

export function UseTemplateDialog({
  campaignId,
  templates,
}: {
  campaignId: string;
  templates: CadenceTemplateOption[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleUse(templateId: string) {
    startTransition(async () => {
      try {
        await useTemplateForCampaign(campaignId, templateId);
        toast.success("Modelo aplicado à campanha.");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Não foi possível aplicar o modelo.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Usar modelo</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Usar modelo de cadência</DialogTitle>
          <DialogDescription>
            As etapas do modelo serão copiadas para esta campanha e poderão ser ajustadas livremente depois.
          </DialogDescription>
        </DialogHeader>

        {templates.length === 0 ? (
          <EmptyState
            title="Nenhum modelo disponível"
            description="Cadastre modelos de cadência em Configurações > Cadências."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {templates.map((template) => (
              <li key={template.id} className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm">
                <div>
                  <p className="font-medium">{template.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {template.channel ? `${template.channel} · ` : ""}
                    {template.step_count} {template.step_count === 1 ? "etapa" : "etapas"}
                  </p>
                </div>
                <Button size="sm" disabled={isPending} onClick={() => handleUse(template.id)}>
                  Usar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
