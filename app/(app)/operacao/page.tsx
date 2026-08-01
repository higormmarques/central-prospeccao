import { ListChecks } from "lucide-react";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { EmptyState } from "@/components/feedback/empty-state";
import { QueueItem } from "@/components/operations/queue-item";
import { getClosingReasons, getQueue } from "./queries";

export default async function OperacaoPage() {
  const [{ atrasadas, hoje, proximas, totalConcluidasHoje }, closingReasons] = await Promise.all([
    getQueue(),
    getClosingReasons(),
  ]);

  const totalPendentes = atrasadas.length + hoje.length + proximas.length;
  const totalHojeGeral = totalConcluidasHoje + hoje.length + atrasadas.length;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs current="Operação" />

      <div>
        <h1 className="text-xl font-semibold">Operação</h1>
        <p className="text-sm text-muted-foreground">
          {totalConcluidasHoje} de {totalHojeGeral} ações concluídas hoje · {hoje.length} para hoje ·{" "}
          {atrasadas.length} atrasadas
        </p>
      </div>

      {totalPendentes === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Nenhuma ação pendente"
          description="Vincule leads a campanhas com cadência para gerar tarefas na Operação."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {atrasadas.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-destructive">Atrasadas ({atrasadas.length})</h2>
              <ul className="flex flex-col gap-3">
                {atrasadas.map((task) => (
                  <QueueItem key={task.id} task={task} closingReasons={closingReasons} overdue />
                ))}
              </ul>
            </section>
          )}

          {hoje.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold">Para hoje ({hoje.length})</h2>
              <ul className="flex flex-col gap-3">
                {hoje.map((task) => (
                  <QueueItem key={task.id} task={task} closingReasons={closingReasons} overdue={false} />
                ))}
              </ul>
            </section>
          )}

          {proximas.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-muted-foreground">Próximas ({proximas.length})</h2>
              <ul className="flex flex-col gap-3">
                {proximas.map((task) => (
                  <QueueItem key={task.id} task={task} closingReasons={closingReasons} overdue={false} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
