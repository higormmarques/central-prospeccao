"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LeadGeneralStatus } from "@/types/leads";

const STATUS_CHIPS: { label: string; value: LeadGeneralStatus | "todos" }[] = [
  { label: "Todos", value: "todos" },
  { label: "Novos", value: "novo" },
  { label: "Ativos", value: "ativo" },
  { label: "Encerrados", value: "encerrado" },
  { label: "Arquivados", value: "arquivado" },
];

export function LeadsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  const activeStatus = searchParams.get("status") ?? "todos";

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateParams({ q: q || null });
          }}
          onBlur={() => updateParams({ q: q || null })}
          placeholder="Pesquisar por nome, empresa ou documento..."
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUS_CHIPS.map((chip) => (
          <Badge
            key={chip.value}
            variant={activeStatus === chip.value ? "default" : "outline"}
            className={cn("cursor-pointer select-none")}
            onClick={() => updateParams({ status: chip.value === "todos" ? null : chip.value })}
          >
            {chip.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
