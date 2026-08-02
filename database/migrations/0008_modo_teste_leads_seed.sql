-- Central de Prospecção — Modo Teste (ajuste)
-- Os leads de demonstração usados para testar as etapas anteriores
-- (Base de Leads e Operação) ficaram fora do Modo Teste na migration 0007,
-- porque só a campanha "Campanha Teste E07" havia sido migrada. Isso
-- deixava tarefas reais e atrasadas na fila de Operação real referenciando
-- uma campanha que só existe no Modo Teste. Confirmado com o usuário que
-- são leads de teste — movidos para o Modo Teste junto com seus contatos.

update public.leads set is_test = true
  where name in ('Dr. João Pereira', 'Dra. Fernanda Lima', 'Clínica Teste E05');

update public.contacts set is_test = true
  where id in (
    select contact_id from public.lead_contacts
    where lead_id in (
      select id from public.leads
      where name in ('Dr. João Pereira', 'Dra. Fernanda Lima', 'Clínica Teste E05')
    )
  );
