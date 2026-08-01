"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { postponeTask } from "@/app/(app)/operacao/actions";

export function PostponeControl({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handlePostpone() {
    if (!date) return;
    startTransition(async () => {
      try {
        await postponeTask(taskId, date);
        toast.success("Tarefa adiada.");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Não foi possível adiar a tarefa.");
      }
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <CalendarClock className="h-3.5 w-3.5" />
        Adiar
      </PopoverTrigger>
      <PopoverContent className="flex w-56 flex-col gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button size="sm" disabled={!date || isPending} onClick={handlePostpone}>
          Confirmar nova data
        </Button>
      </PopoverContent>
    </Popover>
  );
}
