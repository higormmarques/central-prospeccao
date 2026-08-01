import { BarChart3 } from "lucide-react";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { EmptyState } from "@/components/feedback/empty-state";

export default function RelatoriosPage() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs current="Relatórios" />
      <EmptyState
        icon={BarChart3}
        title="Relatórios ainda não implementados"
        description="KPIs operacionais e visão por campanha chegam na Etapa 09."
      />
    </div>
  );
}
