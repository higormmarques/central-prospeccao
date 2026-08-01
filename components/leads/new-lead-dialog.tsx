"use client";

import { useRef, useState, useTransition } from "react";
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
import { createLead } from "@/app/(app)/leads/actions";

export function NewLeadDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const { id } = await createLead(formData);
        toast.success("Lead cadastrado.");
        setOpen(false);
        formRef.current?.reset();
        router.push(`/leads?lead=${id}`);
        router.refresh();
      } catch {
        toast.error("Não foi possível cadastrar o lead.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Novo lead
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo lead</DialogTitle>
          <DialogDescription>
            Cadastro manual. Campanha e cadência podem ser vinculadas depois.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="name">Nome do lead *</Label>
              <Input id="name" name="name" required placeholder="Clínica Vida" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="trade_name">Empresa</Label>
              <Input id="trade_name" name="trade_name" placeholder="Nome fantasia" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="source">Origem</Label>
              <Input id="source" name="source" placeholder="Indicação, site..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" name="city" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="state">UF</Label>
              <Input id="state" name="state" maxLength={2} className="uppercase" />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-md border p-3">
            <p className="text-sm font-medium">Contato principal (opcional)</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="contact_name">Nome</Label>
                <Input id="contact_name" name="contact_name" placeholder="Dra. Mariana" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact_phone">Telefone / WhatsApp</Label>
                <Input id="contact_phone" name="contact_phone" placeholder="(92) 99999-9999" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact_email">E-mail</Label>
                <Input id="contact_email" name="contact_email" type="email" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
