"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageCircle, MoreHorizontal, Archive, ArchiveRestore } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildWhatsAppLink } from "@/services/whatsapp/link";
import { setLeadStatus } from "@/app/(app)/leads/actions";
import type { LeadListItem } from "@/types/leads";

export function LeadRowActions({ lead }: { lead: LeadListItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const whatsappLink = buildWhatsAppLink(lead.primary_contact_whatsapp);
  const isArchived = lead.general_status === "arquivado";

  function toggleArchive() {
    startTransition(async () => {
      try {
        await setLeadStatus(lead.id, isArchived ? "ativo" : "arquivado");
        toast.success(isArchived ? "Lead reativado." : "Lead arquivado.");
        router.refresh();
      } catch {
        toast.error("Não foi possível concluir a ação.");
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <MessageCircle className="h-4 w-4" />
        </a>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={toggleArchive} disabled={isPending}>
            {isArchived ? (
              <>
                <ArchiveRestore className="h-4 w-4" /> Reativar
              </>
            ) : (
              <>
                <Archive className="h-4 w-4" /> Arquivar
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
