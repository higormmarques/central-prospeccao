"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pause, Play, CheckCircle2, Archive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { setCampaignStatus } from "@/app/(app)/campanhas/actions";
import type { CampaignListItem, CampaignStatus } from "@/types/campaigns";

export function CampaignCard({ campaign }: { campaign: CampaignListItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function changeStatus(status: CampaignStatus, message: string) {
    startTransition(async () => {
      try {
        await setCampaignStatus(campaign.id, status);
        toast.success(message);
        router.refresh();
      } catch {
        toast.error("Não foi possível concluir a ação.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">
            <Link href={`/campanhas/${campaign.id}`} className="hover:underline">
              {campaign.name}
            </Link>
          </CardTitle>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {campaign.objective ?? "Sem objetivo definido."}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {campaign.status !== "active" && campaign.status !== "finished" && (
              <DropdownMenuItem disabled={isPending} onClick={() => changeStatus("active", "Campanha ativada.")}>
                <Play className="h-4 w-4" /> Ativar
              </DropdownMenuItem>
            )}
            {campaign.status === "active" && (
              <DropdownMenuItem disabled={isPending} onClick={() => changeStatus("paused", "Campanha pausada.")}>
                <Pause className="h-4 w-4" /> Pausar
              </DropdownMenuItem>
            )}
            {(campaign.status === "active" || campaign.status === "paused") && (
              <DropdownMenuItem
                disabled={isPending}
                onClick={() => changeStatus("finished", "Campanha finalizada.")}
              >
                <CheckCircle2 className="h-4 w-4" /> Finalizar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem disabled={isPending} onClick={() => changeStatus("archived", "Campanha arquivada.")}>
              <Archive className="h-4 w-4" /> Arquivar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <CampaignStatusBadge status={campaign.status} />
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p className="font-semibold">{campaign.total_leads}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div>
            <p className="font-semibold">{campaign.active_leads}</p>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </div>
          <div>
            <p className="font-semibold">{campaign.closed_leads}</p>
            <p className="text-xs text-muted-foreground">Encerrados</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Responsável: {campaign.owner_user_name ?? "—"}
        </p>
      </CardContent>
    </Card>
  );
}
