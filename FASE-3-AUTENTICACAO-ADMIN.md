# Próxima fase — autenticação e painel administrativo

Depois dos testes da sincronização e do aplicativo do cliente, implementar:

- login por e-mail/senha para administradores e profissionais;
- associação entre `auth.users` e `profissionais`;
- políticas RLS de produção usando `auth.uid()`;
- painel administrativo para profissionais, serviços, horários e relatórios gerais;
- remoção das políticas públicas de teste;
- armazenamento de fotos no Supabase Storage em vez de Base64.
