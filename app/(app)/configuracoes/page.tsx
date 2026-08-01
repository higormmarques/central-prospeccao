import { Settings } from "lucide-react";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { EmptyState } from "@/components/feedback/empty-state";

export default function ConfiguracoesPage() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs current="Configurações" />
      <EmptyState
        icon={Settings}
        title="Configurações ainda não implementadas"
        description="Gestão de usuários, perfis e integrações prevista para as próximas etapas."
      />
    </div>
  );
}
