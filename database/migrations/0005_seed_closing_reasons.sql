-- Central de Prospecção — Etapa 07: Operação diária
-- A tabela reasons estava vazia em produção, bloqueando o encerramento de
-- participações (doc10: "Todo encerramento exige motivo padronizado").
-- Motivos baseados na lista de doc02, secao 2.8 (Encerramento da cadência).

insert into public.reasons (type, name, description) values
  ('closing', 'Sem resposta', 'Lead não respondeu após todas as tentativas da cadência.'),
  ('closing', 'Sem interesse', 'Lead manifestou explicitamente que não tem interesse.'),
  ('closing', 'Valor ou condição inviável', 'Lead demonstrou interesse mas o valor/condição não é viável no momento.'),
  ('closing', 'Reunião agendada', 'Oportunidade encaminhada para reunião ou comercial.'),
  ('closing', 'Contato inválido', 'Telefone, e-mail ou WhatsApp inválido ou incorreto.'),
  ('closing', 'Outro motivo', 'Encerramento por motivo não padronizado — ver observações da interação.');
