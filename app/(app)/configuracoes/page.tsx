import { ShieldAlert } from "lucide-react";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { EmptyState } from "@/components/feedback/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersTable } from "@/components/settings/users-table";
import { ReasonsManager } from "@/components/settings/reasons-manager";
import { CadenceTemplatesManager } from "@/components/settings/cadence-templates-manager";
import { createClient } from "@/lib/supabase/server";
import { getCadenceTemplates, getCurrentUserRole, getReasons, getRoles, getUsers } from "./queries";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentRole = await getCurrentUserRole();

  if (currentRole !== "administrador") {
    return (
      <div className="flex flex-col gap-6">
        <Breadcrumbs current="Configurações" />
        <EmptyState
          icon={ShieldAlert}
          title="Acesso restrito"
          description="Configurações e Administração é visível apenas para administradores."
        />
      </div>
    );
  }

  const [users, roles, reasons, cadenceTemplates] = await Promise.all([
    getUsers(),
    getRoles(),
    getReasons(),
    getCadenceTemplates(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs current="Configurações" />

      <div>
        <h1 className="text-xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Usuários, perfis e motivos padronizados da Central.</p>
      </div>

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="motivos">Motivos</TabsTrigger>
          <TabsTrigger value="cadencias">Cadências</TabsTrigger>
        </TabsList>
        <TabsContent value="usuarios" className="pt-4">
          <UsersTable users={users} roles={roles} currentUserId={user!.id} />
        </TabsContent>
        <TabsContent value="motivos" className="pt-4">
          <ReasonsManager reasons={reasons} />
        </TabsContent>
        <TabsContent value="cadencias" className="pt-4">
          <CadenceTemplatesManager templates={cadenceTemplates} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
