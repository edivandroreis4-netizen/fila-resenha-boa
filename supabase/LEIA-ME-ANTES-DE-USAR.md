# Supabase — preparação para os testes

Esta versão não exige instalar o Supabase no computador. Crie um projeto no painel do Supabase, execute o arquivo SQL e preencha `js/supabase-config.js`.

## Ordem

1. Crie um projeto Supabase.
2. Abra **SQL Editor**.
3. Execute `01-schema-e-politicas-de-teste.sql`.
4. Copie a URL do projeto e a chave publicável/anon.
5. Cole os valores em `js/supabase-config.js`.
6. Publique novamente na Vercel.
7. No app do barbeiro, abra **Configurações → Supabase e sincronização → Enviar dados locais**.
8. Abra `/cliente/` e faça um pré-agendamento.

## Aviso de segurança

As políticas deste arquivo permitem testes sem login. Não use esta configuração como versão comercial definitiva. Depois dos testes, a próxima fase deve adicionar Supabase Auth e políticas RLS ligadas ao usuário autenticado.

## Regra da barbearia

O cliente vê em destaque que o horário é apenas uma preferência. A entrada na fila acontece quando o barbeiro confirma a chegada, e a posição é definida pelo horário real da confirmação.
