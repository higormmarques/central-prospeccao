import { Library } from "lucide-react";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { EmptyState } from "@/components/feedback/empty-state";

export default function BibliotecaPage() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs current="Central de Conteúdo" />
      <EmptyState
        icon={Library}
        title="Central de Conteúdo ainda não implementada"
        description="Scripts, objeções e materiais chegam na Etapa 08."
      />
    </div>
  );
}
