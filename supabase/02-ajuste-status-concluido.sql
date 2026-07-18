-- Barbearia Resenha Boa
-- Execute uma única vez no SQL Editor do Supabase atual.

begin;

alter table public.agendamentos
  drop constraint if exists agendamentos_status_check;

alter table public.agendamentos
  add constraint agendamentos_status_check
  check (
    status in (
      'agendado',
      'na_fila',
      'cancelado',
      'atendido',
      'concluido'
    )
  );

alter table public.agendamentos
  add column if not exists concluido_em timestamptz;

update public.agendamentos
set
  status = 'concluido',
  concluido_em = coalesce(concluido_em, atualizado_em, now())
where status = 'atendido';

commit;
