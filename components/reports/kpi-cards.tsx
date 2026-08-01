import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OperationalKpis } from "@/types/reports";

export function KpiCards({ kpis }: { kpis: OperationalKpis }) {
  const items = [
    { label: "Leads (total)", value: kpis.totalLeads },
    { label: "Leads ativos", value: kpis.activeLeads },
    { label: "Tarefas concluídas", value: kpis.tasksCompleted },
    { label: "Follow-ups atrasados", value: kpis.overdueTasks, alert: kpis.overdueTasks > 0 },
    { label: "Interações registradas", value: kpis.interactionsCount },
    { label: "Taxa de resposta", value: `${kpis.responseRate}%` },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{item.label}</CardTitle>
          </CardHeader>
          <CardContent className={`text-2xl font-semibold ${item.alert ? "text-destructive" : ""}`}>
            {item.value}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
