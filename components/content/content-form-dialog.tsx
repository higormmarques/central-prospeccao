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
import { createContent, updateContent } from "@/app/(app)/biblioteca/actions";
import type { Content, ContentType } from "@/types/content";

const TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: "script", label: "Script" },
  { value: "objecao", label: "Objeção" },
  { value: "material", label: "Material" },
  { value: "playbook", label: "Playbook" },
  { value: "email_template", label: "Modelo de e-mail" },
  { value: "link", label: "Link útil" },
];

const FILE_TYPES: ContentType[] = ["material", "link"];

export function ContentFormDialog({ content, defaultType }: { content?: Content; defaultType?: ContentType }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ContentType>(content?.type ?? defaultType ?? "script");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isEdit = Boolean(content);
  const isFileType = FILE_TYPES.includes(type);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (content) {
          await updateContent(content.id, formData);
          toast.success("Conteúdo atualizado.");
        } else {
          await createContent(formData);
          toast.success("Conteúdo cadastrado.");
        }
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Não foi possível salvar o conteúdo.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={isEdit ? "ghost" : "default"} size={isEdit ? "icon-sm" : "default"} />}>
        {isEdit ? (
          <Pencil className="h-4 w-4" />
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Novo conteúdo
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar conteúdo" : "Novo conteúdo"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Salvar cria uma nova versão, preservando o histórico."
              : "Scripts, objeções, materiais e outros conteúdos reutilizáveis."}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value as ContentType)}
                disabled={isEdit}
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm disabled:opacity-50"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category">Categoria</Label>
              <Input id="category" name="category" defaultValue={content?.category ?? ""} placeholder="Abordagem, preço..." />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">
              {type === "objecao" ? "Objeção *" : "Título *"}
            </Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={content?.title}
              placeholder={type === "objecao" ? "É muito caro" : "Abordagem inicial - clínica"}
            />
          </div>

          {isFileType && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="external_url">Link do material</Label>
              <Input
                id="external_url"
                name="external_url"
                type="url"
                defaultValue={content?.external_url ?? ""}
                placeholder="https://drive.google.com/..."
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="body">{type === "objecao" ? "Resposta sugerida" : "Conteúdo"}</Label>
            <Textarea id="body" name="body" rows={4} defaultValue={content?.body ?? ""} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="channel">Canal</Label>
            <select
              id="channel"
              name="channel"
              defaultValue={content?.channel ?? ""}
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
            >
              <option value="">Sem canal específico</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="ligacao">Ligação</option>
              <option value="email">E-mail</option>
              <option value="reuniao">Reunião</option>
              <option value="outro">Outro</option>
            </select>
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
