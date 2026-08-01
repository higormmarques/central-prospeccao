"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, MessageCircle, Pencil, Plus, Star } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge, PriorityBadge } from "@/components/leads/badges";
import { buildWhatsAppLink } from "@/services/whatsapp/link";
import { addContactToLead, getLeadDetail, setPrimaryContact, updateLead } from "@/app/(app)/leads/actions";

type LeadDetail = Awaited<ReturnType<typeof getLeadDetail>>;

export function LeadDrawer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get("lead");
  const open = Boolean(leadId);

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingContact, setAddingContact] = useState(false);
  const [isPending, startTransition] = useTransition();
  const editFormRef = useRef<HTMLFormElement>(null);
  const contactFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!leadId) {
      setLead(null);
      return;
    }
    setLoading(true);
    setEditing(false);
    getLeadDetail(leadId)
      .then(setLead)
      .catch(() => toast.error("Não foi possível carregar o lead."))
      .finally(() => setLoading(false));
  }, [leadId]);

  function close() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("lead");
    router.push(`/leads${params.size ? `?${params.toString()}` : ""}`);
  }

  function refresh() {
    if (!leadId) return;
    getLeadDetail(leadId).then(setLead);
  }

  function handleSaveEdit(formData: FormData) {
    if (!leadId) return;
    startTransition(async () => {
      try {
        await updateLead(leadId, formData);
        toast.success("Lead atualizado.");
        setEditing(false);
        refresh();
        router.refresh();
      } catch {
        toast.error("Não foi possível salvar as alterações.");
      }
    });
  }

  function handleAddContact(formData: FormData) {
    if (!leadId) return;
    startTransition(async () => {
      try {
        await addContactToLead(leadId, formData);
        toast.success("Contato adicionado.");
        setAddingContact(false);
        contactFormRef.current?.reset();
        refresh();
        router.refresh();
      } catch {
        toast.error("Não foi possível adicionar o contato.");
      }
    });
  }

  function handleSetPrimary(leadContactId: string) {
    if (!leadId) return;
    startTransition(async () => {
      try {
        await setPrimaryContact(leadId, leadContactId);
        refresh();
        router.refresh();
      } catch {
        toast.error("Não foi possível definir o contato principal.");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !next && close()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        {loading || !lead ? (
          <div className="flex flex-col gap-4 p-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-start justify-between gap-2 pr-8">
                <div>
                  <SheetTitle className="text-lg">{lead.name}</SheetTitle>
                  <SheetDescription>{lead.trade_name ?? "Sem nome fantasia"}</SheetDescription>
                </div>
                <div className="flex gap-1.5">
                  <StatusBadge status={lead.general_status} />
                  <PriorityBadge priority={lead.priority} />
                </div>
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-6 px-4 pb-4">
              {/* Resumo / edição */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Resumo</h3>
                  {!editing && (
                    <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </Button>
                  )}
                </div>

                {editing ? (
                  <form ref={editFormRef} action={handleSaveEdit} className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 flex flex-col gap-1.5">
                        <Label htmlFor="edit_name">Nome do lead</Label>
                        <Input id="edit_name" name="name" defaultValue={lead.name} required />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="edit_trade_name">Empresa</Label>
                        <Input id="edit_trade_name" name="trade_name" defaultValue={lead.trade_name ?? ""} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="edit_source">Origem</Label>
                        <Input id="edit_source" name="source" defaultValue={lead.source ?? ""} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="edit_city">Cidade</Label>
                        <Input id="edit_city" name="city" defaultValue={lead.city ?? ""} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="edit_state">UF</Label>
                        <Input id="edit_state" name="state" defaultValue={lead.state ?? ""} maxLength={2} />
                      </div>
                      <div className="col-span-2 flex flex-col gap-1.5">
                        <Label htmlFor="edit_legal_name">Razão social</Label>
                        <Input id="edit_legal_name" name="legal_name" defaultValue={lead.legal_name ?? ""} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="edit_bitrix_deal_id">ID do negócio (Bitrix)</Label>
                        <Input
                          id="edit_bitrix_deal_id"
                          name="bitrix_deal_id"
                          type="number"
                          defaultValue={lead.bitrix_deal_id ?? ""}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="edit_bitrix_url">Link do Bitrix</Label>
                        <Input id="edit_bitrix_url" name="bitrix_url" type="url" defaultValue={lead.bitrix_url ?? ""} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="edit_notes">Observações</Label>
                      <Textarea id="edit_notes" name="notes" defaultValue={lead.notes ?? ""} rows={3} />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={isPending}>
                        Salvar
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                ) : (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Origem</dt>
                      <dd>{lead.source ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Cidade/UF</dt>
                      <dd>{lead.city ? `${lead.city}/${lead.state ?? ""}` : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Responsável</dt>
                      <dd>{lead.assigned_user?.name ?? "—"}</dd>
                    </div>
                    {(lead.bitrix_url || lead.bitrix_deal_id) && (
                      <div>
                        <dt className="text-muted-foreground">Bitrix</dt>
                        <dd>
                          {lead.bitrix_url ? (
                            <a
                              href={lead.bitrix_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Ver negócio #{lead.bitrix_deal_id}
                            </a>
                          ) : (
                            `#${lead.bitrix_deal_id}`
                          )}
                        </dd>
                      </div>
                    )}
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Observações</dt>
                      <dd className="whitespace-pre-wrap">{lead.notes ?? "—"}</dd>
                    </div>
                  </dl>
                )}
              </section>

              {/* Contatos */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Contatos</h3>
                  <Button variant="ghost" size="sm" onClick={() => setAddingContact((v) => !v)}>
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </Button>
                </div>

                {lead.lead_contacts?.length ? (
                  <ul className="flex flex-col gap-2">
                    {lead.lead_contacts.map((lc) => {
                      const whatsappLink = buildWhatsAppLink(
                        lc.contact.whatsapp_number ?? lc.contact.phone_normalized,
                      );
                      return (
                        <li
                          key={lc.id}
                          className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm"
                        >
                          <div>
                            <p className="font-medium">
                              {lc.contact.name}
                              {lc.is_primary && (
                                <Star className="ml-1.5 inline h-3.5 w-3.5 fill-primary text-primary" />
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {lc.contact.job_title ?? "—"} · {lc.contact.phone ?? "sem telefone"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {whatsappLink && (
                              <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                              >
                                <MessageCircle className="h-4 w-4" />
                              </a>
                            )}
                            {!lc.is_primary && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isPending}
                                onClick={() => handleSetPrimary(lc.id)}
                              >
                                Definir principal
                              </Button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  !addingContact && (
                    <EmptyState title="Nenhum contato vinculado" description="Adicione o contato principal deste lead." />
                  )
                )}

                {addingContact && (
                  <form
                    ref={contactFormRef}
                    action={handleAddContact}
                    className="flex flex-col gap-3 rounded-md border p-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 flex flex-col gap-1.5">
                        <Label htmlFor="new_contact_name">Nome</Label>
                        <Input id="new_contact_name" name="name" required />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="new_contact_phone">Telefone</Label>
                        <Input id="new_contact_phone" name="phone" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="new_contact_email">E-mail</Label>
                        <Input id="new_contact_email" name="email" type="email" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={isPending}>
                        Salvar contato
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setAddingContact(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}
              </section>

              {/* Histórico */}
              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">Histórico</h3>
                {lead.interactions?.length ? (
                  <ul className="flex flex-col gap-2 border-l pl-3">
                    {lead.interactions.map((interaction) => (
                      <li key={interaction.id} className="text-sm">
                        <p className="text-xs text-muted-foreground">
                          {new Date(interaction.occurred_at).toLocaleString("pt-BR")} ·{" "}
                          {interaction.user?.name ?? "—"}
                        </p>
                        <p>{interaction.description ?? interaction.interaction_type}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    title="Nenhuma interação registrada ainda"
                    description="O histórico será alimentado pela Operação (Etapa 07)."
                  />
                )}
              </section>
            </div>

            <SheetFooter className="border-t">
              <Button variant="outline" onClick={close}>
                Fechar
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
