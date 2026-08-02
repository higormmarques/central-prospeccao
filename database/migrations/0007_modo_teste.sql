-- Central de Prospecção — Modo Teste
-- Adiciona uma marcação is_test nas tabelas "raiz" (leads, contacts,
-- campaigns, cadences, content, imports) para permitir um ambiente de
-- testes dentro do mesmo banco, sem misturar com os dados reais da
-- operação. Tabelas filhas (cadence_steps, lead_contacts, lead_campaigns,
-- tasks, interactions, import_rows) não precisam de coluna própria: toda
-- FK para a tabela raiz é obrigatória, então a filtragem é feita via join.
--
-- Também migra para is_test = true os registros de teste que já existiam
-- no banco (criados durante o desenvolvimento e testes das etapas
-- anteriores), preservando-os em vez de excluí-los.

alter table public.leads add column is_test boolean not null default false;
alter table public.contacts add column is_test boolean not null default false;
alter table public.campaigns add column is_test boolean not null default false;
alter table public.cadences add column is_test boolean not null default false;
alter table public.content add column is_test boolean not null default false;
alter table public.imports add column is_test boolean not null default false;

update public.campaigns set is_test = true
  where name in ('Campanha Teste E07', 'Campanha Teste Cadência Modelo');

update public.cadences set is_test = true
  where id in (
    select cadence_id from public.campaigns
    where name in ('Campanha Teste E07', 'Campanha Teste Cadência Modelo')
      and cadence_id is not null
  );

update public.cadences set is_test = true
  where name = 'Prospecção Padrão' and is_template = true;
