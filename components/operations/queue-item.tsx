import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CompleteTaskDialog } from "@/components/operations/complete-task-dialog";
import { PostponeControl } from "@/components/operations/postpone-control";
import { buildWhatsAppLink } from "@/services/whatsapp/link";
import type { TaskQueueItem } from "@/types/operations";

const TASK_TYPE_LABEL: Record<string, string> = {
  abordagem: "Abordagem",
  followup: "Follow-up",
  ligacao: "Ligação",
  encerramento: "Encerramento",
};

export function QueueItem({
  task,
  closingReasons,
  overdue,
}: {
  task: TaskQueueItem;
  closingReasons: { id: string; name: string }[];
  overdue: boolean;
}) {
  const whatsappLink = buildWhatsAppLink(
    task.primary_contact?.whatsapp_number ?? task.primary_contact?.phone_normalized,
  );

  return (
    <li className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/leads?lead=${task.lead_id}`} className="font-medium hover:underline">
            {task.lead?.name ?? "—"}
          </Link>
          <Badge variant="outline">{TASK_TYPE_LABEL[task.task_type] ?? task.task_type}</Badge>
          {overdue && <Badge variant="destructive">Atrasada</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          {task.lead_campaign?.campaign?.name ?? "Sem campanha"}
          {task.cadence_step?.name && ` · ${task.cadence_step.name}`}
          {" · "}
          {new Date(`${task.scheduled_date}T00:00:00`).toLocaleDateString("pt-BR")}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </a>
        )}
        <PostponeControl taskId={task.id} />
        <CompleteTaskDialog task={task} closingReasons={closingReasons} />
      </div>
    </li>
  );
}
