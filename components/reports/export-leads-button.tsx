"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExportRow = {
  name: string;
  trade_name: string | null;
  city: string | null;
  state: string | null;
  general_status: string;
  priority: string;
  source: string | null;
  created_at: string;
};

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function ExportLeadsButton({ leads }: { leads: ExportRow[] }) {
  function handleExport() {
    const headers = ["Nome", "Empresa", "Cidade", "UF", "Status", "Prioridade", "Origem", "Cadastrado em"];
    const rows = leads.map((lead) =>
      [
        lead.name,
        lead.trade_name ?? "",
        lead.city ?? "",
        lead.state ?? "",
        lead.general_status,
        lead.priority,
        lead.source ?? "",
        new Date(lead.created_at).toLocaleDateString("pt-BR"),
      ]
        .map((value) => escapeCsv(String(value)))
        .join(","),
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={leads.length === 0}>
      <Download className="h-4 w-4" />
      Exportar leads (CSV)
    </Button>
  );
}
