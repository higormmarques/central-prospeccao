-- Central de Prospecção — Etapa 06: Campanhas e Cadências
-- cadence_steps é uma tabela de configuração (etapas de uma cadência em
-- construção), não um registro de auditoria de negócio como leads/campaigns.
-- Faz sentido permitir remover uma etapa adicionada por engano, diferente
-- das demais tabelas (ver comentário em 0002_auth_and_policies.sql: "Sem
-- DELETE físico em nenhuma tabela").
grant delete on public.cadence_steps to authenticated;
