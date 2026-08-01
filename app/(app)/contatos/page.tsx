import { Contact as ContactIcon, MessageCircle } from "lucide-react";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { EmptyState } from "@/components/feedback/empty-state";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { ContactDialog } from "@/components/contacts/contact-dialog";
import { createClient } from "@/lib/supabase/server";
import { buildWhatsAppLink } from "@/services/whatsapp/link";
import { Search } from "lucide-react";
import type { Contact } from "@/types/contacts";

export default async function ContatosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("contacts")
    .select("*")
    .order("name", { ascending: true })
    .limit(50);

  if (q?.trim()) {
    const term = q.trim();
    query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,city.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  const contacts = (data ?? []) as Contact[];

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs current="Contatos" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Contatos</h1>
          <p className="text-sm text-muted-foreground">
            Pessoas e canais de comunicação usados na operação comercial.
          </p>
        </div>
        <ContactDialog />
      </div>

      <form method="get" className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={q} placeholder="Pesquisar por nome, telefone, e-mail ou cidade..." className="pl-9" />
      </form>

      {contacts.length === 0 ? (
        <EmptyState
          icon={ContactIcon}
          title="Nenhum contato encontrado"
          description="Cadastre um contato ou ajuste a pesquisa."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Nome</th>
                <th className="px-3 py-2 font-medium">Cargo</th>
                <th className="px-3 py-2 font-medium">Telefone</th>
                <th className="px-3 py-2 font-medium">E-mail</th>
                <th className="px-3 py-2 font-medium">Cidade</th>
                <th className="px-3 py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {contacts.map((contact) => {
                const whatsappLink = buildWhatsAppLink(contact.whatsapp_number ?? contact.phone_normalized);
                return (
                  <tr key={contact.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium">{contact.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{contact.job_title ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{contact.phone ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{contact.email ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{contact.city ?? "—"}</td>
                    <td className="px-3 py-2">
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
                        <ContactDialog contact={contact} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
