-- Central de Prospecção — correção da allowlist de login (Etapa 03)
-- O e-mail correto da conta Google usada para autenticação é
-- higor06marques@gmail.com (o e-mail informado anteriormente,
-- higormmarques@gmail.com, não corresponde à conta Google real).

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
  v_is_allowed := lower(new.email) in ('higor06marques@gmail.com');

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

-- Caso o login de teste anterior já tenha criado a linha com o e-mail
-- certo mas status inactive, libera agora.
update public.users
set role_id = (select id from public.roles where name = 'administrador'),
    status = 'active'
where lower(email) = 'higor06marques@gmail.com';
