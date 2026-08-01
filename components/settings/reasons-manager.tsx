"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { ReasonDialog } from "@/components/settings/reason-dialog";
import { toggleReasonActive } from "@/app/(app)/configuracoes/actions";
import { REASON_TYPE_LABELS } from "@/types/settings";
import type { Reason, ReasonType } from "@/types/settings";

export function ReasonsManager({ reasons }: { reasons: Reason[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle(reason: Reason) {
    startTransition(async () => {
      try {
        await toggleReasonActive(reason.id, !reason.is_active);
        toast.success(reason.is_active ? "Motivo desativado." : "Motivo ativado.");
        router.refresh();
      } catch {
        toast.error("Não foi possível atualizar o motivo.");
      }
    });
  }

  const grouped = reasons.reduce<Record<string, Reason[]>>((acc, reason) => {
    (acc[reason.type] ??= []).push(reason);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <ReasonDialog />
      </div>

      {reasons.length === 0 ? (
        <EmptyState title="Nenhum motivo cadastrado ainda" />
      ) : (
        (Object.entries(grouped) as [ReasonType, Reason[]][]).map(([type, items]) => (
          <section key={type} className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{REASON_TYPE_LABELS[type] ?? type}</h3>
            <ul className="flex flex-col gap-2">
              {items.map((reason) => (
                <li
                  key={reason.id}
                  className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {reason.name}
                      {!reason.is_active && (
                        <Badge variant="outline" className="ml-2">
                          inativo
                        </Badge>
                      )}
                    </p>
                    {reason.description && <p className="text-xs text-muted-foreground">{reason.description}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" disabled={isPending} onClick={() => handleToggle(reason)}>
                      {reason.is_active ? "Desativar" : "Ativar"}
                    </Button>
                    <ReasonDialog reason={reason} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
