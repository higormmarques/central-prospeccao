-- Central de Prospecção — Etapa 03: Autenticação e permissões
-- Provisionamento automático de public.users a partir do login Google
-- (Supabase Auth) e políticas de RLS que liberam o acesso apenas para
-- usuários ativos. Referências: docs/01 (Tela de Login), docs/11 §12
-- (Perfil e Permissão), docs/15 (Arquitetura Técnica), docs/20 (Etapa 03).
--
-- Allowlist inicial: apenas higormmarques@gmail.com. Novos e-mails que
-- fizerem login pelo Google recebem uma linha em public.users com
-- status 'inactive' (sem acesso) até serem liberados manualmente — evita
-- que o trigger falhe e trava o login, e mantém "acesso restrito" mesmo
-- com o provedor Google aberto para qualquer conta.

-- =========================================================================
-- Função auxiliar de autorização — usada nas policies abaixo.
-- SECURITY DEFINER para poder ler public.users mesmo com RLS habilitado.
-- =========================================================================
create or replace function public.is_active_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
      and status = 'active'
      and deleted_at is null
  );
$$;

-- =========================================================================
-- Provisionamento automático de public.users no primeiro login.
-- =========================================================================
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_id uuid;
  v_is_allowed boolean;
begin
  v_is_allowed := lower(new.email) in ('higormmarques@gmail.com');

  select id into v_role_id from public.roles where name = 'administrador';

  insert into public.users (id, name, email, photo_url, role_id, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url',
    case when v_is_allowed then v_role_id else null end,
    case when v_is_allowed then 'active' else 'inactive' end
  )
  on conflict (id) do update set
    last_access_at = now();

  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- =========================================================================
-- Permissões de tabela para o papel `authenticated`.
-- Sem DELETE físico em nenhuma tabela (arquivamento via soft delete/status).
-- `anon` permanece sem nenhuma concessão — não há acesso público.
-- =========================================================================
grant usage on schema public to authenticated;

grant select, insert, update on
  public.roles,
  public.users,
  public.reasons,
  public.content,
  public.cadences,
  public.cadence_steps,
  public.leads,
  public.contacts,
  public.lead_contacts,
  public.campaigns,
  public.lead_campaigns,
  public.tasks,
  public.interactions,
  public.imports,
  public.import_rows,
  public.field_mappings
to authenticated;

alter default privileges in schema public
  grant select, insert, update on tables to authenticated;

-- =========================================================================
-- Políticas de RLS — liberadas apenas para usuários ativos (is_active_user()).
-- =========================================================================
create policy "usuarios_ativos_leem_roles" on public.roles
  for select using (public.is_active_user());

create policy "usuarios_ativos_leem_usuarios" on public.users
  for select using (public.is_active_user());

create policy "usuario_atualiza_proprio_perfil" on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "usuarios_ativos_acessam_reasons" on public.reasons
  for all using (public.is_active_user()) with check (public.is_active_user());

create policy "usuarios_ativos_acessam_content" on public.content
  for all using (public.is_active_user()) with check (public.is_active_user());

create policy "usuarios_ativos_acessam_cadences" on public.cadences
  for all using (public.is_active_user()) with check (public.is_active_user());

create policy "usuarios_ativos_acessam_cadence_steps" on public.cadence_steps
  for all using (public.is_active_user()) with check (public.is_active_user());

create policy "usuarios_ativos_acessam_leads" on public.leads
  for all using (public.is_active_user()) with check (public.is_active_user());

create policy "usuarios_ativos_acessam_contacts" on public.contacts
  for all using (public.is_active_user()) with check (public.is_active_user());

create policy "usuarios_ativos_acessam_lead_contacts" on public.lead_contacts
  for all using (public.is_active_user()) with check (public.is_active_user());

create policy "usuarios_ativos_acessam_campaigns" on public.campaigns
  for all using (public.is_active_user()) with check (public.is_active_user());

create policy "usuarios_ativos_acessam_lead_campaigns" on public.lead_campaigns
  for all using (public.is_active_user()) with check (public.is_active_user());

create policy "usuarios_ativos_acessam_tasks" on public.tasks
  for all using (public.is_active_user()) with check (public.is_active_user());

create policy "usuarios_ativos_acessam_interactions" on public.interactions
  for all using (public.is_active_user()) with check (public.is_active_user());

create policy "usuarios_ativos_acessam_imports" on public.imports
  for all using (public.is_active_user()) with check (public.is_active_user());

create policy "usuarios_ativos_acessam_import_rows" on public.import_rows
  for all using (public.is_active_user()) with check (public.is_active_user());

create policy "usuarios_ativos_acessam_field_mappings" on public.field_mappings
  for all using (public.is_active_user()) with check (public.is_active_user());
