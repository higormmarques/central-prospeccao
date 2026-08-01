import { ListChecks } from "lucide-react";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { EmptyState } from "@/components/feedback/empty-state";

export default function OperacaoPage() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs current="Operação" />
      <EmptyState
        icon={ListChecks}
        title="Fila de tarefas ainda não implementada"
        description="A caixa de entrada de tarefas do dia (abordagens, follow-ups e encerramentos) chega na Etapa 07."
      />
    </div>
  );
}
