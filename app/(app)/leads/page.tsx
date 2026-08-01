import Link from "next/link";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/leads/badges";
import { LeadRowActions } from "@/components/leads/lead-row-actions";
import { LeadsFilters } from "@/components/leads/leads-filters";
import { LeadDrawer } from "@/components/leads/lead-drawer";
import { NewLeadDialog } from "@/components/leads/new-lead-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Upload, Users } from "lucide-react";
import { getLeadCounts, getLeads } from "./queries";
import type { LeadGeneralStatus } from "@/types/leads";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = params.status as LeadGeneralStatus | undefined;
  const page = params.page ? Number(params.page) : 1;

  const [{ leads, total, pageSize }, counts] = await Promise.all([
    getLeads({ q: params.q, status, page }),
    getLeadCounts(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs current="Base de Leads" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Base de Leads</h1>
          <p className="text-sm text-muted-foreground">
            Consulte, organize e gerencie os leads cadastrados na Central.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/leads/importar" className={buttonVariants({ variant: "outline" })}>
            <Upload className="h-4 w-4" />
            Importar lista
          </Link>
          <NewLeadDialog />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de leads</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{counts.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{counts.ativos}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Encerrados</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{counts.encerrados}</CardContent>
        </Card>
      </div>

      <LeadsFilters />

      {leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum lead encontrado"
          description="Ajuste a pesquisa ou os filtros, ou cadastre um novo lead."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Lead</th>
                <th className="px-3 py-2 font-medium">Empresa</th>
                <th className="px-3 py-2 font-medium">Cidade/UF</th>
                <th className="px-3 py-2 font-medium">Prioridade</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Responsável</th>
                <th className="px-3 py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <Link href={`/leads?lead=${lead.id}`} className="font-medium hover:underline">
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{lead.trade_name ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {lead.city ? `${lead.city}/${lead.state ?? ""}` : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <PriorityBadge priority={lead.priority} />
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={lead.general_status} />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{lead.assigned_user_name ?? "—"}</td>
                  <td className="px-3 py-2">
                    <LeadRowActions lead={lead} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > pageSize && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {page} de {Math.ceil(total / pageSize)} · {total} leads
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/leads?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
                className="hover:underline"
              >
                Anterior
              </Link>
            )}
            {page * pageSize < total && (
              <Link
                href={`/leads?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
                className="hover:underline"
              >
                Próxima
              </Link>
            )}
          </div>
        </div>
      )}

      <LeadDrawer />
    </div>
  );
}
