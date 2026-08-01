# database/policies

Políticas de Row Level Security (RLS) e controle de acesso por perfil no Supabase.

O SQL das policies vive junto das migrations (`database/migrations/`), pois
são objetos de schema como qualquer outro. Este arquivo documenta o modelo:

- `public.is_active_user()`: função SECURITY DEFINER que verifica se
  `auth.uid()` corresponde a uma linha em `public.users` com
  `status = 'active'` e `deleted_at is null`.
- Toda tabela de negócio usa essa função como policy `FOR ALL` — ou seja,
  por enquanto o controle é binário (ativo vs. inativo), sem granularidade
  por perfil (administrador/gestor/consultor/somente_leitura). A
  diferenciação por perfil é um refinamento futuro, quando o módulo de
  Configurações (doc 08) definir as capacidades de cada perfil.
- O papel `anon` não recebe nenhuma concessão (GRANT) — não há acesso
  público, mesmo de leitura.
- Novos usuários que fazem login pelo Google e não estão na allowlist do
  trigger `handle_new_auth_user` são criados com `status = 'inactive'` e
  ficam bloqueados por essas policies até serem liberados manualmente.
