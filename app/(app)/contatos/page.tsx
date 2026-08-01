import { Contact } from "lucide-react";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { EmptyState } from "@/components/feedback/empty-state";

export default function ContatosPage() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs current="Contatos" />
      <EmptyState
        icon={Contact}
        title="Contatos ainda não implementados"
        description="Cadastro e vínculo de contatos aos leads chega na Etapa 05."
      />
    </div>
  );
}
