"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { updateCampaign } from "@/app/(app)/campanhas/actions";
import type { Campaign } from "@/types/campaigns";

export function CampaignHeader({
  campaign,
  ownerName,
}: {
  campaign: Campaign;
  ownerName: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave(formData: FormData) {
    startTransition(async () => {
      try {
        await updateCampaign(campaign.id, formData);
        toast.success("Campanha atualizada.");
        setEditing(false);
        router.refresh();
      } catch {
        toast.error("Não foi possível salvar as alterações.");
      }
    });
  }

  if (editing) {
    return (
      <form action={handleSave} className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" defaultValue={campaign.name} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="objective">Objetivo</Label>
          <Textarea id="objective" name="objective" rows={2} defaultValue={campaign.objective ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" name="description" rows={2} defaultValue={campaign.description ?? ""} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="start_date">Início</Label>
            <Input id="start_date" name="start_date" type="date" defaultValue={campaign.start_date ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="end_date">Término previsto</Label>
            <Input id="end_date" name="end_date" type="date" defaultValue={campaign.end_date ?? ""} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isPending}>
            Salvar
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{campaign.name}</h1>
          <CampaignStatusBadge status={campaign.status} />
        </div>
        <p className="text-sm text-muted-foreground">{campaign.objective ?? "Sem objetivo definido."}</p>
        <p className="text-xs text-muted-foreground">
          Responsável: {ownerName ?? "—"}
          {campaign.start_date && ` · Início: ${new Date(campaign.start_date).toLocaleDateString("pt-BR")}`}
          {campaign.end_date && ` · Término previsto: ${new Date(campaign.end_date).toLocaleDateString("pt-BR")}`}
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
        <Pencil className="h-3.5 w-3.5" /> Editar
      </Button>
    </div>
  );
}
