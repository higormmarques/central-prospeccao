import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { KpiCards } from "@/components/reports/kpi-cards";
import { CampaignSummaryTable } from "@/components/reports/campaign-summary-table";
import { ClosingReasonsBreakdown } from "@/components/reports/closing-reasons-breakdown";
import { ExportLeadsButton } from "@/components/reports/export-leads-button";
import { PeriodFilter } from "@/components/reports/period-filter";
import { getCampaignSummaries, getClosingReasonBreakdown, getLeadsForExport, getOperationalKpis } from "./queries";

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo } = await searchParams;
  const periodDays = periodo === "todos" ? null : Number(periodo ?? "30");

  const [kpis, campaigns, closingReasons, leads] = await Promise.all([
    getOperationalKpis(periodDays),
    getCampaignSummaries(),
    getClosingReasonBreakdown(periodDays),
    getLeadsForExport(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs current="Relatórios" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Relatórios</h1>
          <p className="text-sm text-muted-foreground">
            Indicadores operacionais e desempenho das campanhas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodFilter />
          <ExportLeadsButton leads={leads} />
        </div>
      </div>

      <KpiCards kpis={kpis} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Campanhas</h2>
          <CampaignSummaryTable campaigns={campaigns} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Motivos de encerramento</h2>
          <ClosingReasonsBreakdown reasons={closingReasons} />
        </section>
      </div>
    </div>
  );
}
