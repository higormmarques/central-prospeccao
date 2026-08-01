import { Library } from "lucide-react";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { EmptyState } from "@/components/feedback/empty-state";
import { ContentFilters } from "@/components/content/content-filters";
import { ContentFormDialog } from "@/components/content/content-form-dialog";
import { ContentCard } from "@/components/content/content-card";
import { getContents } from "./queries";
import type { ContentType } from "@/types/content";

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  const { type, q } = await searchParams;
  const contents = await getContents({ type: type as ContentType | undefined, q });

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs current="Central de Conteúdo" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Central de Conteúdo</h1>
          <p className="text-sm text-muted-foreground">
            Scripts, objeções e materiais reutilizáveis da operação comercial.
          </p>
        </div>
        <ContentFormDialog defaultType={type as ContentType | undefined} />
      </div>

      <ContentFilters />

      {contents.length === 0 ? (
        <EmptyState
          icon={Library}
          title="Nenhum conteúdo encontrado"
          description="Ajuste a pesquisa ou cadastre o primeiro script, objeção ou material."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contents.map((content) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      )}
    </div>
  );
}
