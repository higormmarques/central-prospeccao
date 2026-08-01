-- Central de Prospecção — Configurações e Administração (doc08)
-- Ate aqui, liberar/gerenciar um usuario exigia escrever uma migration a
-- mao (Etapa 03). Esta migration prepara o banco para uma tela de
-- Usuarios: um administrador passa a poder ativar/desativar outros
-- usuarios e atribuir perfil, sem precisar de SQL.

create or replace function public.is_admin_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.users u
    join public.roles r on r.id = u.role_id
    where u.id = auth.uid()
      and u.status = 'active'
      and u.deleted_at is null
      and r.name = 'administrador'
  );
$$;

-- Soma-se a policy existente "usuario_atualiza_proprio_perfil" (que
-- continua valendo para autoedição) -- Postgres combina policies do
-- mesmo comando com OR.
create policy "admin_gerencia_usuarios" on public.users
  for update using (public.is_admin_user()) with check (public.is_admin_user());
