"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
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
import { createReason, updateReason } from "@/app/(app)/configuracoes/actions";
import { REASON_TYPE_LABELS } from "@/types/settings";
import type { Reason, ReasonType } from "@/types/settings";

export function ReasonDialog({ reason }: { reason?: Reason }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isEdit = Boolean(reason);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (reason) {
          await updateReason(reason.id, formData);
          toast.success("Motivo atualizado.");
        } else {
          await createReason(formData);
          toast.success("Motivo cadastrado.");
        }
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Não foi possível salvar o motivo.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={isEdit ? "ghost" : "outline"} size={isEdit ? "icon-sm" : "sm"} />}>
        {isEdit ? (
          <Pencil className="h-3.5 w-3.5" />
        ) : (
          <>
            <Plus className="h-3.5 w-3.5" />
            Novo motivo
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar motivo" : "Novo motivo"}</DialogTitle>
          <DialogDescription>Motivos padronizados alimentam filtros, relatórios e encerramentos.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                name="type"
                defaultValue="closing"
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
              >
                {(Object.entries(REASON_TYPE_LABELS) as [ReasonType, string][]).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" name="name" required defaultValue={reason?.name} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" rows={2} defaultValue={reason?.description ?? ""} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
