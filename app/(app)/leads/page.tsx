import { Users } from "lucide-react";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { EmptyState } from "@/components/feedback/empty-state";

export default function LeadsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs current="Base de Leads" />
      <EmptyState
        icon={Users}
        title="Base de Leads ainda não implementada"
        description="Listagem, ficha do lead e contatos vinculados chegam na Etapa 05."
      />
    </div>
  );
}
