"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
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
import { createContact, updateContact } from "@/app/(app)/contatos/actions";
import type { Contact } from "@/types/contacts";

export function ContactDialog({ contact }: { contact?: Contact }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isEdit = Boolean(contact);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (contact) {
          await updateContact(contact.id, formData);
          toast.success("Contato atualizado.");
        } else {
          await createContact(formData);
          toast.success("Contato cadastrado.");
        }
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Não foi possível salvar o contato.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={isEdit ? "ghost" : "default"} size={isEdit ? "icon-sm" : "default"} />}>
        {isEdit ? <Pencil className="h-4 w-4" /> : (
          <>
            <Plus className="h-4 w-4" />
            Novo contato
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar contato" : "Novo contato"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados do contato." : "Contatos podem ser vinculados a um lead depois, pela ficha do lead."}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" name="name" required defaultValue={contact?.name} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="job_title">Cargo/Função</Label>
              <Input id="job_title" name="job_title" defaultValue={contact?.job_title ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input id="phone" name="phone" defaultValue={contact?.phone ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" defaultValue={contact?.email ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" name="city" defaultValue={contact?.city ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="state">UF</Label>
              <Input id="state" name="state" maxLength={2} defaultValue={contact?.state ?? ""} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={contact?.notes ?? ""} />
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
