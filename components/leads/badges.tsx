import { Badge } from "@/components/ui/badge";
import type { LeadGeneralStatus, Priority } from "@/types/leads";

const STATUS_LABEL: Record<LeadGeneralStatus, string> = {
  novo: "Novo",
  ativo: "Ativo",
  encerrado: "Encerrado",
  arquivado: "Arquivado",
};

const STATUS_VARIANT: Record<LeadGeneralStatus, "default" | "secondary" | "outline"> = {
  novo: "secondary",
  ativo: "default",
  encerrado: "outline",
  arquivado: "outline",
};

export function StatusBadge({ status }: { status: LeadGeneralStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

const PRIORITY_LABEL: Record<Priority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant={priority === "urgente" || priority === "alta" ? "destructive" : "outline"}>
      {PRIORITY_LABEL[priority]}
    </Badge>
  );
}
