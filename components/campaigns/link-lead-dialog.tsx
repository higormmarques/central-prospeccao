"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LinkIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { linkExistingLead, searchLeadsForLinking } from "@/app/(app)/campanhas/actions";

export function LinkLeadDialog({ campaignId }: { campaignId: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; trade_name: string | null }[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSearch(value: string) {
    setQ(value);
    startTransition(async () => {
      const found = await searchLeadsForLinking(value);
      setResults(found);
    });
  }

  function handleLink(leadId: string) {
    startTransition(async () => {
      try {
        await linkExistingLead(campaignId, leadId);
        toast.success("Lead vinculado à campanha.");
        setOpen(false);
        setQ("");
        setResults([]);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Não foi possível vincular o lead.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <LinkIcon className="h-4 w-4" />
        Vincular lead existente
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular lead existente</DialogTitle>
          <DialogDescription>
            O lead continua único na Base de Leads; a campanha só registra a participação.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Nome do lead ou empresa..."
            className="pl-9"
          />
        </div>
        <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
          {results.map((lead) => (
            <li key={lead.id}>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleLink(lead.id)}
                className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                <span className="font-medium">{lead.name}</span>
                {lead.trade_name && (
                  <span className="text-muted-foreground"> · {lead.trade_name}</span>
                )}
              </button>
            </li>
          ))}
          {q && !results.length && (
            <li className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum lead encontrado.</li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
