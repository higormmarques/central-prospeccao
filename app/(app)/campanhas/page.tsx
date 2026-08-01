import { Megaphone } from "lucide-react";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { EmptyState } from "@/components/feedback/empty-state";

export default function CampanhasPage() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs current="Campanhas" />
      <EmptyState
        icon={Megaphone}
        title="Campanhas ainda não implementadas"
        description="Campanhas, participação de leads e cadências chegam na Etapa 06."
      />
    </div>
  );
}
