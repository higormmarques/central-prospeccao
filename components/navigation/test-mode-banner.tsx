"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FlaskConical } from "lucide-react";
import { setTestMode } from "@/app/(app)/configuracoes/actions";

export function TestModeBanner() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleExit() {
    startTransition(async () => {
      try {
        await setTestMode(false);
        router.refresh();
      } catch {
        toast.error("Não foi possível voltar ao modo real.");
      }
    });
  }

  return (
    <div className="flex h-9 items-center justify-center gap-3 bg-amber-500 px-4 text-sm font-medium text-amber-950">
      <FlaskConical className="h-4 w-4" />
      Modo Teste ativo — nada aqui afeta a operação real.
      <button
        type="button"
        disabled={isPending}
        onClick={handleExit}
        className="underline underline-offset-2 disabled:opacity-50"
      >
        Voltar ao modo real
      </button>
    </div>
  );
}
