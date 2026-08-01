"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { updateUserRoleStatus } from "@/app/(app)/configuracoes/actions";
import type { ManagedUser, Role } from "@/types/settings";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UsersTable({
  users,
  roles,
  currentUserId,
}: {
  users: ManagedUser[];
  roles: Role[];
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(user: ManagedUser, next: { roleId?: string | null; status?: "active" | "inactive" }) {
    startTransition(async () => {
      try {
        await updateUserRoleStatus(user.id, {
          roleId: next.roleId !== undefined ? next.roleId : user.role_id,
          status: next.status ?? user.status,
        });
        toast.success("Usuário atualizado.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Não foi possível atualizar o usuário.");
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Usuário</th>
            <th className="px-3 py-2 font-medium">Perfil</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Último acesso</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.photo_url ?? undefined} alt={user.name} />
                    <AvatarFallback className="text-xs">{initials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {user.name} {user.id === currentUserId && <span className="text-xs text-muted-foreground">(você)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2">
                <select
                  value={user.role_id ?? ""}
                  disabled={isPending || user.id === currentUserId}
                  onChange={(e) => handleChange(user, { roleId: e.target.value || null })}
                  className="h-8 rounded-lg border border-input bg-background px-2 text-sm disabled:opacity-50"
                >
                  <option value="">Sem perfil</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2">
                <select
                  value={user.status}
                  disabled={isPending || user.id === currentUserId}
                  onChange={(e) => handleChange(user, { status: e.target.value as "active" | "inactive" })}
                  className="h-8 rounded-lg border border-input bg-background px-2 text-sm disabled:opacity-50"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {user.last_access_at ? new Date(user.last_access_at).toLocaleString("pt-BR") : "—"}
                {!user.role_id && <Badge variant="outline" className="ml-2">sem acesso liberado</Badge>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
