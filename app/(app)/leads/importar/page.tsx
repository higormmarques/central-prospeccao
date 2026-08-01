import Link from "next/link";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { EmptyState } from "@/components/feedback/empty-state";
import { ImportWizard } from "@/components/imports/import-wizard";
import { History } from "lucide-react";
import { getCampaignOptions, getImportHistory } from "./queries";

export default async function ImportarPage() {
  const [campaigns, history] = await Promise.all([getCampaignOptions(), getImportHistory()]);

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumbs current="Importar leads" />

      <div>
        <h1 className="text-xl font-semibold">Importar leads</h1>
        <p className="text-sm text-muted-foreground">
          Envie um arquivo CSV, mapeie as colunas e revise antes de confirmar.
        </p>
      </div>

      <ImportWizard campaigns={campaigns} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Importações anteriores</h2>
        {history.length === 0 ? (
          <EmptyState icon={History} title="Nenhuma importação registrada ainda" />
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Arquivo</th>
                  <th className="px-3 py-2 font-medium">Campanha</th>
                  <th className="px-3 py-2 font-medium">Total</th>
                  <th className="px-3 py-2 font-medium">Novos</th>
                  <th className="px-3 py-2 font-medium">Duplicados</th>
                  <th className="px-3 py-2 font-medium">Erros</th>
                  <th className="px-3 py-2 font-medium">Usuário</th>
                  <th className="px-3 py-2 font-medium">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 font-medium">{item.file_name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{item.campaign_name ?? "—"}</td>
                    <td className="px-3 py-2">{item.total_rows}</td>
                    <td className="px-3 py-2">{item.new_records}</td>
                    <td className="px-3 py-2">{item.duplicate_records}</td>
                    <td className="px-3 py-2">{item.error_records}</td>
                    <td className="px-3 py-2 text-muted-foreground">{item.user_name ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(item.started_at).toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Link href="/leads" className="text-sm text-muted-foreground hover:underline">
        ← Voltar para a Base de Leads
      </Link>
    </div>
  );
}
