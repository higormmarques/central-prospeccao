-- Central de Prospecção — Etapa 02: Banco de dados
-- Migration inicial: estrutura relacional do MVP, ainda sem interface.
-- Referências: docs/11 (modelo conceitual), docs/13 (dicionário de dados),
-- docs/14 (modelo de dados e estrutura das tabelas), docs/10 (regras de negócio).
--
-- Convenções adotadas nesta migration:
-- - Enums de negócio são armazenados como texto + CHECK (mais simples de
--   alterar em migrations futuras do que enums nativos do Postgres).
-- - Exclusão lógica (soft delete) nas entidades editáveis/críticas: leads,
--   contacts, campaigns, cadences, content, reasons, roles.
-- - public.users referencia auth.users(id) diretamente (padrão Supabase Auth);
--   o gatilho que popula essa tabela no cadastro fica para a Etapa 03
--   (Autenticação e permissões), que também definirá as políticas de RLS
--   por perfil. Por ora, o RLS é habilitado em modo "negar tudo" (nenhuma
--   policy) em todas as tabelas, para que a anon key não exponha dados
--   antes da Etapa 03.

-- extensão usada para gen_random_uuid()
create extension if not exists pgcrypto;

-- função utilitária para manter updated_at em dia
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================================
-- roles
-- =========================================================================
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid
);

create trigger trg_roles_updated_at
  before update on public.roles
  for each row execute function public.set_updated_at();

insert into public.roles (name, description) values
  ('administrador', 'Acesso completo, incluindo configurações e administração.'),
  ('gestor', 'Gerencia campanhas, cadências e relatórios da equipe.'),
  ('consultor', 'Executa a operação diária: leads, tarefas e interações.'),
  ('somente_leitura', 'Acesso apenas para consulta, sem edição.');

-- =========================================================================
-- users (perfil interno, 1:1 com auth.users)
-- =========================================================================
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  photo_url text,
  role_id uuid references public.roles (id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'inactive')),
  last_access_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.users (id) on delete restrict
);

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- as FKs de auditoria (created_by/updated_by/deleted_by) das tabelas abaixo
-- só podem ser criadas depois de public.users existir.
alter table public.roles
  add constraint fk_roles_deleted_by foreign key (deleted_by) references public.users (id) on delete restrict;

-- =========================================================================
-- reasons (motivos padronizados)
-- =========================================================================
create table public.reasons (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('response', 'closing', 'loss', 'reactivation', 'cancellation')),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users (id) on delete restrict,
  updated_by uuid references public.users (id) on delete restrict,
  deleted_at timestamptz,
  deleted_by uuid references public.users (id) on delete restrict
);

create trigger trg_reasons_updated_at
  before update on public.reasons
  for each row execute function public.set_updated_at();

-- =========================================================================
-- content (scripts, objeções, materiais, playbooks)
-- =========================================================================
create table public.content (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('script', 'objecao', 'material', 'link', 'playbook', 'email_template')),
  category text,
  title text not null,
  description text,
  body text,
  file_url text,
  external_url text,
  channel text check (channel in ('whatsapp', 'ligacao', 'email', 'reuniao', 'outro')),
  version integer not null default 1 check (version >= 1),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  author_user_id uuid references public.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users (id) on delete restrict,
  updated_by uuid references public.users (id) on delete restrict,
  deleted_at timestamptz,
  deleted_by uuid references public.users (id) on delete restrict
);

create trigger trg_content_updated_at
  before update on public.content
  for each row execute function public.set_updated_at();

-- =========================================================================
-- cadences e cadence_steps
-- =========================================================================
create table public.cadences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  channel text check (channel in ('whatsapp', 'ligacao', 'email', 'reuniao', 'outro')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  is_template boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users (id) on delete restrict,
  updated_by uuid references public.users (id) on delete restrict,
  deleted_at timestamptz,
  deleted_by uuid references public.users (id) on delete restrict
);

create trigger trg_cadences_updated_at
  before update on public.cadences
  for each row execute function public.set_updated_at();

create table public.cadence_steps (
  id uuid primary key default gen_random_uuid(),
  cadence_id uuid not null references public.cadences (id) on delete cascade,
  name text not null,
  step_order integer not null check (step_order > 0),
  action_type text not null check (action_type in ('whatsapp', 'ligacao', 'email', 'reuniao', 'encerramento', 'outro')),
  interval_days integer not null default 0 check (interval_days >= 0),
  content_id uuid references public.content (id) on delete set null,
  is_required boolean not null default true,
  is_closing_step boolean not null default false,
  next_step_id uuid references public.cadence_steps (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cadence_id, step_order)
);

create trigger trg_cadence_steps_updated_at
  before update on public.cadence_steps
  for each row execute function public.set_updated_at();

-- =========================================================================
-- leads
-- =========================================================================
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trade_name text,
  legal_name text,
  person_type text check (person_type in ('PF', 'PJ')),
  document_number text,
  source text,
  general_status text not null default 'novo' check (general_status in ('novo', 'ativo', 'encerrado', 'arquivado')),
  priority text not null default 'media' check (priority in ('baixa', 'media', 'alta', 'urgente')),
  assigned_user_id uuid references public.users (id) on delete set null,
  bitrix_deal_id integer,
  bitrix_pipeline_id text,
  bitrix_stage_id text,
  bitrix_url text,
  city text,
  state text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users (id) on delete restrict,
  updated_by uuid references public.users (id) on delete restrict,
  deleted_at timestamptz,
  deleted_by uuid references public.users (id) on delete restrict
);

create trigger trg_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

create unique index ux_leads_bitrix_deal_id on public.leads (bitrix_deal_id) where bitrix_deal_id is not null;
create index ix_leads_name on public.leads (name);
create index ix_leads_document_number on public.leads (document_number) where document_number is not null;
create index ix_leads_assigned_user_id on public.leads (assigned_user_id);
create index ix_leads_general_status on public.leads (general_status);

-- =========================================================================
-- contacts e lead_contacts
-- =========================================================================
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  greeting text,
  job_title text,
  phone text,
  phone_normalized text,
  whatsapp_number text,
  email text,
  city text,
  state text,
  preferred_channel text check (preferred_channel in ('whatsapp', 'email', 'ligacao')),
  best_contact_time text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users (id) on delete restrict,
  updated_by uuid references public.users (id) on delete restrict,
  deleted_at timestamptz,
  deleted_by uuid references public.users (id) on delete restrict
);

create trigger trg_contacts_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

create index ix_contacts_phone_normalized on public.contacts (phone_normalized) where phone_normalized is not null;
create index ix_contacts_email on public.contacts (email) where email is not null;

create table public.lead_contacts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  is_primary boolean not null default false,
  receives_whatsapp boolean not null default true,
  receives_email boolean not null default true,
  relationship_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id, contact_id)
);

create trigger trg_lead_contacts_updated_at
  before update on public.lead_contacts
  for each row execute function public.set_updated_at();

-- apenas um contato principal ativo por lead
create unique index ux_lead_contacts_primary on public.lead_contacts (lead_id) where is_primary;

-- =========================================================================
-- campaigns
-- =========================================================================
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  objective text,
  description text,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'finished', 'archived')),
  priority text not null default 'media' check (priority in ('baixa', 'media', 'alta')),
  owner_user_id uuid references public.users (id) on delete set null,
  cadence_id uuid references public.cadences (id) on delete set null,
  start_date date,
  end_date date check (end_date is null or start_date is null or end_date >= start_date),
  is_template boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users (id) on delete restrict,
  updated_by uuid references public.users (id) on delete restrict,
  deleted_at timestamptz,
  deleted_by uuid references public.users (id) on delete restrict
);

create trigger trg_campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

create index ix_campaigns_status on public.campaigns (status);

-- =========================================================================
-- lead_campaigns (participação do lead na campanha)
-- =========================================================================
create table public.lead_campaigns (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  assigned_user_id uuid references public.users (id) on delete set null,
  status text not null default 'novo' check (status in (
    'importado', 'novo', 'em_abordagem', 'em_followup', 'aguardando_resposta',
    'em_negociacao', 'agendamento_solicitado', 'encerrado', 'arquivado'
  )),
  current_cadence_step_id uuid references public.cadence_steps (id) on delete set null,
  priority text check (priority in ('baixa', 'media', 'alta', 'urgente')),
  entered_at timestamptz not null default now(),
  started_at timestamptz,
  closed_at timestamptz,
  closing_reason_id uuid references public.reasons (id) on delete set null,
  result text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_lead_campaigns_updated_at
  before update on public.lead_campaigns
  for each row execute function public.set_updated_at();

-- no máximo uma participação ativa do mesmo lead na mesma campanha
create unique index ux_lead_campaigns_active on public.lead_campaigns (lead_id, campaign_id) where is_active;
create index ix_lead_campaigns_status on public.lead_campaigns (status);
create index ix_lead_campaigns_campaign_id on public.lead_campaigns (campaign_id);
create index ix_lead_campaigns_assigned_user_id on public.lead_campaigns (assigned_user_id);

-- =========================================================================
-- tasks (o que deve ser feito)
-- =========================================================================
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  lead_campaign_id uuid references public.lead_campaigns (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  cadence_step_id uuid references public.cadence_steps (id) on delete set null,
  assigned_user_id uuid references public.users (id) on delete set null,
  task_type text not null check (task_type in ('abordagem', 'followup', 'ligacao', 'encerramento')),
  status text not null default 'pendente' check (status in ('pendente', 'concluida', 'cancelada', 'atrasada')),
  priority text not null default 'media' check (priority in ('baixa', 'media', 'alta', 'urgente')),
  scheduled_date date not null,
  scheduled_time time,
  completed_at timestamptz,
  result text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create index ix_tasks_scheduled_date_status on public.tasks (scheduled_date, status);
create index ix_tasks_assigned_user_id on public.tasks (assigned_user_id);
create index ix_tasks_lead_campaign_id on public.tasks (lead_campaign_id);

-- =========================================================================
-- interactions (o que realmente aconteceu)
-- =========================================================================
create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  lead_campaign_id uuid references public.lead_campaigns (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  task_id uuid references public.tasks (id) on delete set null,
  user_id uuid not null references public.users (id) on delete restrict,
  channel text not null check (channel in ('whatsapp', 'ligacao', 'email', 'reuniao', 'outro')),
  interaction_type text not null,
  direction text not null check (direction in ('outbound', 'inbound', 'internal')),
  content_id uuid references public.content (id) on delete set null,
  description text,
  result text,
  result_reason_id uuid references public.reasons (id) on delete set null,
  occurred_at timestamptz not null default now(),
  next_action_type text,
  next_action_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_interactions_updated_at
  before update on public.interactions
  for each row execute function public.set_updated_at();

create index ix_interactions_occurred_at on public.interactions (occurred_at);
create index ix_interactions_lead_campaign_id on public.interactions (lead_campaign_id);
create index ix_interactions_lead_id on public.interactions (lead_id);

-- =========================================================================
-- imports e import_rows
-- =========================================================================
create table public.imports (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_url text,
  campaign_id uuid references public.campaigns (id) on delete set null,
  user_id uuid not null references public.users (id) on delete restrict,
  source text not null check (source in ('bitrix', 'csv', 'manual', 'outro')),
  total_rows integer not null default 0 check (total_rows >= 0),
  new_records integer not null default 0 check (new_records >= 0),
  updated_records integer not null default 0 check (updated_records >= 0),
  duplicate_records integer not null default 0 check (duplicate_records >= 0),
  error_records integer not null default 0 check (error_records >= 0),
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.imports (id) on delete cascade,
  row_number integer not null,
  external_id text,
  lead_id uuid references public.leads (id) on delete set null,
  status text not null check (status in ('new', 'updated', 'duplicate', 'error', 'ignored')),
  error_message text,
  raw_data jsonb
);

create index ix_import_rows_import_id on public.import_rows (import_id);

-- =========================================================================
-- field_mappings (mapeamento de campos externos, ex. Bitrix)
-- =========================================================================
create table public.field_mappings (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('bitrix', 'csv', 'outro')),
  source_field text not null,
  target_entity text not null,
  target_field text not null,
  data_type text,
  transformation_rule text,
  is_required boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_type, source_field, target_entity, target_field)
);

create trigger trg_field_mappings_updated_at
  before update on public.field_mappings
  for each row execute function public.set_updated_at();

-- =========================================================================
-- Row Level Security — negar tudo por padrão (anon/authenticated).
-- Políticas por perfil serão definidas na Etapa 03 (Autenticação e
-- permissões) em database/policies/. service_role continua com acesso
-- total (bypassa RLS), usado por rotinas de servidor/migrations.
-- =========================================================================
alter table public.roles enable row level security;
alter table public.users enable row level security;
alter table public.reasons enable row level security;
alter table public.content enable row level security;
alter table public.cadences enable row level security;
alter table public.cadence_steps enable row level security;
alter table public.leads enable row level security;
alter table public.contacts enable row level security;
alter table public.lead_contacts enable row level security;
alter table public.campaigns enable row level security;
alter table public.lead_campaigns enable row level security;
alter table public.tasks enable row level security;
alter table public.interactions enable row level security;
alter table public.imports enable row level security;
alter table public.import_rows enable row level security;
alter table public.field_mappings enable row level security;
