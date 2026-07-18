-- Barbearia Resenha Boa
-- Execute uma única vez no SQL Editor do Supabase atual.
-- Esta migração adiciona presença manual e aviso de proximidade.

begin;

alter table public.agendamentos
  add column if not exists status_presenca text
  not null default 'nao_confirmado';

alter table public.agendamentos
  drop constraint if exists agendamentos_status_presenca_check;

alter table public.agendamentos
  add constraint agendamentos_status_presenca_check
  check (
    status_presenca in (
      'nao_confirmado',
      'a_caminho',
      'presente',
      'ausente'
    )
  );

alter table public.agendamentos
  add column if not exists presenca_atualizada_em timestamptz;

alter table public.agendamentos
  add column if not exists aviso_proximidade_em timestamptz;

update public.agendamentos
set
  status_presenca = case
    when status in ('na_fila', 'atendido', 'concluido') then 'presente'
    else coalesce(status_presenca, 'nao_confirmado')
  end,
  presenca_atualizada_em = case
    when status in ('na_fila', 'atendido', 'concluido')
      then coalesce(presenca_atualizada_em, chegada_confirmada_em, atualizado_em)
    else presenca_atualizada_em
  end;

commit;
