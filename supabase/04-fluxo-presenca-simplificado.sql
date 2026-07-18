-- Barbearia Resenha Boa
-- Execute uma única vez no SQL Editor do projeto atual.
-- Simplifica o fluxo de presença e remove o estado "a_caminho".

begin;

update public.agendamentos
set
  status_presenca = 'nao_confirmado',
  atualizado_em = now()
where status_presenca = 'a_caminho';

alter table public.agendamentos
  drop constraint if exists agendamentos_status_presenca_check;

alter table public.agendamentos
  add constraint agendamentos_status_presenca_check
  check (
    status_presenca in (
      'nao_confirmado',
      'presente',
      'ausente'
    )
  );

commit;
