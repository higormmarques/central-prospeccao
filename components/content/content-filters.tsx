"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ContentType } from "@/types/content";

const TYPE_CHIPS: { label: string; value: ContentType | "todos" }[] = [
  { label: "Todos", value: "todos" },
  { label: "Scripts", value: "script" },
  { label: "Objeções", value: "objecao" },
  { label: "Materiais", value: "material" },
  { label: "Playbooks", value: "playbook" },
  { label: "Modelos de e-mail", value: "email_template" },
  { label: "Links úteis", value: "link" },
];

export function ContentFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  const activeType = searchParams.get("type") ?? "todos";

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
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
          placeholder="Pesquisar por título, categoria ou conteúdo..."
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {TYPE_CHIPS.map((chip) => (
          <Badge
            key={chip.value}
            variant={activeType === chip.value ? "default" : "outline"}
            className="cursor-pointer select-none"
            onClick={() => updateParams({ type: chip.value === "todos" ? null : chip.value })}
          >
            {chip.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
