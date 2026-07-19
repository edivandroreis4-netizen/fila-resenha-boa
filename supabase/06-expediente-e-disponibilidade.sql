-- Barbearia Resenha Boa
-- Controle de expediente e bloqueio seguro de novos pedidos.
-- Execute UMA VEZ depois da migração 05.

begin;

alter table public.profissionais
  add column if not exists status_expediente text
    not null default 'expediente_encerrado',
  add column if not exists expediente_data date,
  add column if not exists expediente_iniciado_em timestamptz,
  add column if not exists expediente_encerrado_em timestamptz;

alter table public.profissionais
  drop constraint if exists profissionais_status_expediente_check;

alter table public.profissionais
  add constraint profissionais_status_expediente_check
  check (
    status_expediente in (
      'recebendo_clientes',
      'fechado_novos_clientes',
      'expediente_encerrado'
    )
  );

-- Mantém o comportamento atual dos profissionais que já estavam ativos
-- no momento em que a migração for executada.
update public.profissionais
set
  status_expediente = 'recebendo_clientes',
  expediente_data = (now() at time zone 'America/Bahia')::date,
  expediente_iniciado_em = coalesce(expediente_iniciado_em, now()),
  expediente_encerrado_em = null,
  atualizado_em = now()
where ativo = true
  and expediente_data is null;

create or replace function public.criar_agendamento_cliente(
  p_barbearia_id uuid,
  p_profissional_id uuid,
  p_cliente_nome text,
  p_cliente_telefone text,
  p_servico_id uuid,
  p_data_agendada date,
  p_hora_preferida time,
  p_observacao text default null,
  p_cliente_token_hash text default null
)
returns public.agendamentos
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_profissional public.profissionais%rowtype;
  v_servico public.servicos%rowtype;
  v_agendamento public.agendamentos%rowtype;
  v_hoje_bahia date :=
    (now() at time zone 'America/Bahia')::date;
begin
  if nullif(trim(p_cliente_nome), '') is null then
    raise exception 'Informe o nome do cliente.';
  end if;

  if nullif(trim(p_cliente_telefone), '') is null then
    raise exception 'Informe o telefone do cliente.';
  end if;

  select *
  into v_profissional
  from public.profissionais
  where id = p_profissional_id
    and barbearia_id = p_barbearia_id
  for share;

  if not found or not v_profissional.ativo then
    raise exception 'Este profissional não está disponível.';
  end if;

  if v_profissional.status_expediente <> 'recebendo_clientes'
     or v_profissional.expediente_data is distinct from v_hoje_bahia then
    if v_profissional.status_expediente = 'fechado_novos_clientes' then
      raise exception 'Este profissional fechou para novos clientes.';
    end if;

    raise exception 'O expediente deste profissional está encerrado.';
  end if;

  select *
  into v_servico
  from public.servicos
  where id = p_servico_id
    and barbearia_id = p_barbearia_id
    and profissional_id = p_profissional_id
    and ativo = true;

  if not found then
    raise exception 'O serviço selecionado não está disponível para este profissional.';
  end if;

  insert into public.agendamentos (
    barbearia_id,
    profissional_id,
    cliente_nome,
    cliente_telefone,
    servico_id,
    servico_nome,
    valor,
    data_agendada,
    hora_preferida,
    status,
    observacao,
    status_presenca,
    cliente_token_hash,
    atualizado_em
  )
  values (
    p_barbearia_id,
    p_profissional_id,
    trim(p_cliente_nome),
    trim(p_cliente_telefone),
    v_servico.id,
    v_servico.nome,
    v_servico.preco,
    p_data_agendada,
    p_hora_preferida,
    'agendado',
    nullif(trim(coalesce(p_observacao, '')), ''),
    'nao_confirmado',
    p_cliente_token_hash,
    now()
  )
  returning * into v_agendamento;

  return v_agendamento;
end;
$$;

revoke all on function public.criar_agendamento_cliente(
  uuid, uuid, text, text, uuid, date, time, text, text
) from public;

grant execute on function public.criar_agendamento_cliente(
  uuid, uuid, text, text, uuid, date, time, text, text
) to anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profissionais'
  ) then
    alter publication supabase_realtime
      add table public.profissionais;
  end if;
end;
$$;

commit;
