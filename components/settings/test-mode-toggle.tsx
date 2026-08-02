"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { setTestMode } from "@/app/(app)/configuracoes/actions";

export function TestModeToggle({ active }: { active: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle() {
    startTransition(async () => {
      try {
        await setTestMode(!active);
        toast.success(active ? "Modo Teste desativado." : "Modo Teste ativado.");
        router.refresh();
      } catch {
        toast.error("Não foi possível alternar o Modo Teste.");
      }
    });
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border p-4",
        active && "border-amber-500/50 bg-amber-500/10",
      )}
    >
      <div className="flex items-start gap-3">
        <FlaskConical className={cn("mt-0.5 h-5 w-5", active ? "text-amber-600" : "text-muted-foreground")} />
        <div>
          <p className="text-sm font-medium">Modo Teste</p>
          <p className="text-sm text-muted-foreground">
            {active
              ? "Ativado: você está vendo e criando apenas dados de teste, separados da operação real."
              : "Desativado: você está vendo apenas os dados reais da operação."}
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        disabled={isPending}
        onClick={handleToggle}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
          active ? "bg-amber-500" : "bg-input",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            active ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
