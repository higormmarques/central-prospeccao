"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createCampaign } from "@/app/(app)/campanhas/actions";

export function NewCampaignDialog() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const { id } = await createCampaign(formData);
        toast.success("Campanha criada.");
        router.push(`/campanhas/${id}`);
      } catch {
        toast.error("Não foi possível criar a campanha.");
      }
    });
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Nova campanha
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova campanha</DialogTitle>
          <DialogDescription>
            A campanha começa como rascunho. Ative quando estiver pronta para gerar ações.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" name="name" required placeholder="Mês do Amigo — Julho/2026" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="objective">Objetivo</Label>
            <Textarea
              id="objective"
              name="objective"
              rows={2}
              placeholder="Reativar oportunidades perdidas usando as condições especiais de julho."
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="start_date">Início</Label>
              <Input id="start_date" name="start_date" type="date" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="end_date">Término previsto</Label>
              <Input id="end_date" name="end_date" type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar campanha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
