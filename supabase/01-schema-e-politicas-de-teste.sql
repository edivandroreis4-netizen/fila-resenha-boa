-- Barbearia Resenha Boa — fases 1 e 2 (testes sem autenticação)
-- Execute no SQL Editor de um projeto Supabase novo.

create extension if not exists pgcrypto;

create table if not exists public.barbearias (
  id uuid primary key,
  nome text not null,
  slug text not null unique,
  regra_atendimento text not null default 'ordem_de_chegada',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.profissionais (
  id uuid primary key,
  barbearia_id uuid not null references public.barbearias(id) on delete cascade,
  nome text not null,
  foto_base64 text,
  whatsapp text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.servicos (
  id uuid primary key,
  barbearia_id uuid not null references public.barbearias(id) on delete cascade,
  profissional_id uuid not null references public.profissionais(id) on delete cascade,
  nome text not null,
  preco numeric(10,2) not null default 0 check (preco >= 0),
  duracao_minutos integer not null default 30 check (duracao_minutos between 1 and 240),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.clientes (
  id uuid primary key,
  barbearia_id uuid not null references public.barbearias(id) on delete cascade,
  profissional_id uuid not null references public.profissionais(id) on delete cascade,
  nome text not null,
  telefone text not null,
  servico_preferido_id uuid references public.servicos(id) on delete set null,
  pagamento_preferido text,
  observacoes text,
  ultima_visita timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (profissional_id, telefone)
);

create table if not exists public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references public.barbearias(id) on delete cascade,
  profissional_id uuid not null references public.profissionais(id) on delete cascade,
  cliente_nome text not null,
  cliente_telefone text not null,
  servico_id uuid references public.servicos(id) on delete set null,
  servico_nome text not null,
  valor numeric(10,2) not null default 0,
  data_agendada date not null,
  hora_preferida time not null,
  status text not null default 'agendado' check (status in ('agendado','na_fila','cancelado','atendido','concluido')),
  observacao text,
  status_presenca text not null default 'nao_confirmado'
    check (status_presenca in ('nao_confirmado','presente','ausente')),
  presenca_atualizada_em timestamptz,
  aviso_proximidade_em timestamptz,
  chegada_confirmada_em timestamptz,
  concluido_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.fila (
  id uuid primary key,
  barbearia_id uuid not null references public.barbearias(id) on delete cascade,
  profissional_id uuid not null references public.profissionais(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  agendamento_id uuid references public.agendamentos(id) on delete set null,
  nome_cliente text not null,
  telefone text not null,
  servico_id uuid references public.servicos(id) on delete set null,
  servico_nome text not null,
  valor numeric(10,2) not null default 0,
  pagamento text,
  status text not null check (status in ('aguardando','chamado','em_atendimento')),
  entrada_em timestamptz not null,
  iniciado_em timestamptz,
  duracao_prevista_minutos integer,
  previsao_fim_em timestamptz,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.atendimentos (
  id uuid primary key,
  barbearia_id uuid not null references public.barbearias(id) on delete cascade,
  profissional_id uuid not null references public.profissionais(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  agendamento_id uuid references public.agendamentos(id) on delete set null,
  nome_cliente text not null,
  telefone text not null,
  servico_id uuid references public.servicos(id) on delete set null,
  servico_nome text not null,
  valor numeric(10,2) not null default 0,
  pagamento text,
  entrada_em timestamptz not null,
  iniciado_em timestamptz,
  finalizado_em timestamptz not null,
  duracao_segundos integer not null default 0,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.fechamentos (
  id uuid primary key,
  barbearia_id uuid not null references public.barbearias(id) on delete cascade,
  profissional_id uuid not null references public.profissionais(id) on delete cascade,
  data_fechamento date not null,
  quantidade_atendimentos integer not null default 0,
  faturamento numeric(10,2) not null default 0,
  fechado_em timestamptz not null,
  atualizado_em timestamptz not null default now(),
  unique (profissional_id, data_fechamento)
);

create index if not exists idx_agendamentos_profissional_data on public.agendamentos(profissional_id, data_agendada, hora_preferida);
create index if not exists idx_fila_profissional_entrada on public.fila(profissional_id, entrada_em);
create index if not exists idx_atendimentos_profissional_fim on public.atendimentos(profissional_id, finalizado_em);

insert into public.barbearias (id, nome, slug, regra_atendimento)
values ('11111111-1111-4111-8111-111111111111', 'Barbearia Resenha Boa', 'resenha-boa', 'ordem_de_chegada')
on conflict (id) do update set nome = excluded.nome, regra_atendimento = excluded.regra_atendimento;

-- RLS ativado. Estas políticas são APENAS para testes antes da autenticação.
alter table public.barbearias enable row level security;
alter table public.profissionais enable row level security;
alter table public.servicos enable row level security;
alter table public.clientes enable row level security;
alter table public.agendamentos enable row level security;
alter table public.fila enable row level security;
alter table public.atendimentos enable row level security;
alter table public.fechamentos enable row level security;

drop policy if exists "teste leitura barbearia" on public.barbearias;
create policy "teste leitura barbearia" on public.barbearias for select to anon using (ativo = true);

drop policy if exists "teste profissionais" on public.profissionais;
create policy "teste profissionais" on public.profissionais for all to anon using (barbearia_id = '11111111-1111-4111-8111-111111111111') with check (barbearia_id = '11111111-1111-4111-8111-111111111111');

drop policy if exists "teste servicos" on public.servicos;
create policy "teste servicos" on public.servicos for all to anon using (barbearia_id = '11111111-1111-4111-8111-111111111111') with check (barbearia_id = '11111111-1111-4111-8111-111111111111');

drop policy if exists "teste clientes" on public.clientes;
create policy "teste clientes" on public.clientes for all to anon using (barbearia_id = '11111111-1111-4111-8111-111111111111') with check (barbearia_id = '11111111-1111-4111-8111-111111111111');

drop policy if exists "teste agendamentos" on public.agendamentos;
create policy "teste agendamentos" on public.agendamentos for all to anon using (barbearia_id = '11111111-1111-4111-8111-111111111111') with check (barbearia_id = '11111111-1111-4111-8111-111111111111');

drop policy if exists "teste fila" on public.fila;
create policy "teste fila" on public.fila for all to anon using (barbearia_id = '11111111-1111-4111-8111-111111111111') with check (barbearia_id = '11111111-1111-4111-8111-111111111111');

drop policy if exists "teste atendimentos" on public.atendimentos;
create policy "teste atendimentos" on public.atendimentos for all to anon using (barbearia_id = '11111111-1111-4111-8111-111111111111') with check (barbearia_id = '11111111-1111-4111-8111-111111111111');

drop policy if exists "teste fechamentos" on public.fechamentos;
create policy "teste fechamentos" on public.fechamentos for all to anon using (barbearia_id = '11111111-1111-4111-8111-111111111111') with check (barbearia_id = '11111111-1111-4111-8111-111111111111');

-- Ative Realtime para as tabelas que precisam aparecer imediatamente.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='agendamentos') then alter publication supabase_realtime add table public.agendamentos; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='fila') then alter publication supabase_realtime add table public.fila; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='servicos') then alter publication supabase_realtime add table public.servicos; end if;
end $$;
