"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Archive, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentFormDialog } from "@/components/content/content-form-dialog";
import { archiveContent } from "@/app/(app)/biblioteca/actions";
import type { ContentWithAuthor } from "@/types/content";

const TYPE_LABEL: Record<string, string> = {
  script: "Script",
  objecao: "Objeção",
  material: "Material",
  playbook: "Playbook",
  email_template: "Modelo de e-mail",
  link: "Link útil",
};

export function ContentCard({ content }: { content: ContentWithAuthor }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCopy() {
    const text = content.body ?? content.external_url ?? "";
    if (!text) {
      toast.error("Nada para copiar neste item.");
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência.");
  }

  function handleArchive() {
    startTransition(async () => {
      try {
        await archiveContent(content.id);
        toast.success("Conteúdo arquivado.");
        router.refresh();
      } catch {
        toast.error("Não foi possível arquivar.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">{content.title}</CardTitle>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge variant="outline">{TYPE_LABEL[content.type] ?? content.type}</Badge>
            {content.category && <Badge variant="secondary">{content.category}</Badge>}
            <span className="text-xs text-muted-foreground">v{content.version}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {content.body && <p className="line-clamp-3 text-sm text-muted-foreground">{content.body}</p>}
        {content.external_url && (
          <a
            href={content.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir material
          </a>
        )}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
            Copiar
          </Button>
          <ContentFormDialog content={content} />
          <Button variant="ghost" size="icon-sm" disabled={isPending} onClick={handleArchive} title="Arquivar">
            <Archive className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
