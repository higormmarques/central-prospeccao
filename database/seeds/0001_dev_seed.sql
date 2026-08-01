-- Central de Prospecção — dados fictícios para desenvolvimento/testes.
-- NÃO executar em produção. Uso local ou em um projeto Supabase de
-- desenvolvimento separado (ver docs/15, seção "Ambientes").
--
-- Não popula `users`/`interactions`/`imports` porque essas tabelas exigem
-- um usuário real (FK para auth.users), o que só existe após a Etapa 03
-- (Autenticação e permissões).

insert into public.reasons (type, name, description) values
  ('closing', 'Sem resposta', 'Lead não respondeu após todas as tentativas da cadência.'),
  ('loss', 'Sem orçamento no momento', 'Lead demonstrou interesse mas não há orçamento disponível.'),
  ('reactivation', 'Pediu retorno futuro', 'Lead solicitou novo contato em uma data futura.');

insert into public.content (type, category, title, body, channel, status) values
  ('script', 'abordagem', 'Abordagem inicial - clínica', 'Olá, tudo bem? Aqui é da Amigo...', 'whatsapp', 'active'),
  ('objecao', 'preco', 'Objeção - preço alto', 'Entendo a preocupação com o investimento...', 'whatsapp', 'active');

with nova_cadencia as (
  insert into public.cadences (name, description, channel, is_template)
  values ('Cadência Resgate', 'Cadência padrão para reativação de leads frios.', 'whatsapp', true)
  returning id
)
insert into public.cadence_steps (cadence_id, name, step_order, action_type, interval_days, is_required)
select id, 'Abordagem inicial', 1, 'whatsapp', 0, true from nova_cadencia
union all
select id, 'Follow-up 1', 2, 'whatsapp', 2, true from nova_cadencia
union all
select id, 'Encerramento', 3, 'encerramento', 5, true from nova_cadencia;

with campanha as (
  insert into public.campaigns (name, objective, status, cadence_id)
  select 'Mês do Amigo', 'Reativar oportunidades perdidas', 'active', id
  from public.cadences where name = 'Cadência Resgate'
  returning id
), lead_novo as (
  insert into public.leads (name, trade_name, person_type, general_status, priority, city, state)
  values ('Clínica Vida', 'Clínica Vida', 'PJ', 'ativo', 'alta', 'Manaus', 'AM')
  returning id
), contato_novo as (
  insert into public.contacts (name, job_title, phone, phone_normalized, whatsapp_number, preferred_channel)
  values ('Dra. Mariana', 'Médica', '(92) 99999-9999', '5592999999999', '5592999999999', 'whatsapp')
  returning id
), vinculo as (
  insert into public.lead_contacts (lead_id, contact_id, is_primary)
  select lead_novo.id, contato_novo.id, true from lead_novo, contato_novo
  returning lead_id
)
insert into public.lead_campaigns (lead_id, campaign_id, status)
select lead_novo.id, campanha.id, 'novo' from lead_novo, campanha;

insert into public.tasks (lead_id, lead_campaign_id, task_type, status, priority, scheduled_date)
select l.id, lc.id, 'abordagem', 'pendente', 'alta', current_date
from public.leads l
join public.lead_campaigns lc on lc.lead_id = l.id
where l.name = 'Clínica Vida';
