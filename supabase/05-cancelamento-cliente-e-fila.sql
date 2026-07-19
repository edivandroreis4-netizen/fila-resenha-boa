-- Barbearia Resenha Boa
-- Cancelamento pelo cliente com motivo opcional e recálculo da fila.
-- Execute UMA VEZ no SQL Editor do Supabase antes de publicar esta versão.

begin;

create extension if not exists pgcrypto;

alter table public.agendamentos
  add column if not exists cliente_token_hash text,
  add column if not exists cancelado_em timestamptz,
  add column if not exists cancelado_por text,
  add column if not exists cancelamento_motivo text;

alter table public.agendamentos
  drop constraint if exists agendamentos_cancelado_por_check;

alter table public.agendamentos
  add constraint agendamentos_cancelado_por_check
  check (
    cancelado_por is null
    or cancelado_por in ('cliente', 'barbeiro', 'sistema')
  );

create or replace function public.cancelar_agendamento_cliente(
  p_agendamento_id uuid,
  p_cliente_token text,
  p_motivo text default null
)
returns public.agendamentos
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_agendamento public.agendamentos;
  v_status_fila text;
begin
  if p_cliente_token is null or length(trim(p_cliente_token)) < 16 then
    raise exception 'Token de acompanhamento inválido.';
  end if;

  select *
    into v_agendamento
  from public.agendamentos
  where id = p_agendamento_id
    and barbearia_id = '11111111-1111-4111-8111-111111111111'
  for update;

  if not found then
    raise exception 'Agendamento não encontrado.';
  end if;

  if v_agendamento.status in ('concluido', 'atendido') then
    raise exception 'O atendimento já foi concluído e não pode ser cancelado.';
  end if;

  if v_agendamento.status = 'cancelado' then
    return v_agendamento;
  end if;

  if v_agendamento.cliente_token_hash is null
     or v_agendamento.cliente_token_hash <> encode(digest(p_cliente_token, 'sha256'), 'hex') then
    raise exception 'Este aparelho não possui autorização para cancelar o agendamento.';
  end if;

  select status
    into v_status_fila
  from public.fila
  where agendamento_id = p_agendamento_id
  order by entrada_em
  limit 1
  for update;

  if v_status_fila = 'em_atendimento' then
    raise exception 'O atendimento já foi iniciado. Procure o profissional para qualquer alteração.';
  end if;

  -- A fila é transitória. O agendamento permanece no histórico como cancelado.
  delete from public.fila
  where agendamento_id = p_agendamento_id
    and status in ('aguardando', 'chamado');

  update public.agendamentos
  set
    status = 'cancelado',
    cancelado_em = now(),
    cancelado_por = 'cliente',
    cancelamento_motivo = nullif(left(trim(coalesce(p_motivo, '')), 240), ''),
    atualizado_em = now()
  where id = p_agendamento_id
  returning * into v_agendamento;

  return v_agendamento;
end;
$$;

revoke all on function public.cancelar_agendamento_cliente(uuid, text, text) from public;
grant execute on function public.cancelar_agendamento_cliente(uuid, text, text) to anon, authenticated;

commit;
