# Correção V3 — cancelamento e fila

Durante o teste, o agendamento foi corretamente marcado como `cancelado`,
mas o cliente permaneceu visível na fila do barbeiro.

A V3 corrige esse cenário em duas camadas:

1. ao receber um agendamento cancelado, o painel remove imediatamente o
   item correspondente da fila local;
2. o painel executa uma limpeza complementar no Supabase para remover
   entradas `aguardando` ou `chamado` ligadas ao agendamento cancelado.

Também foi corrigido o selo do cliente em atendimento:

- antes: `Na fila`;
- agora: `Em atendimento`.

Não é necessário executar uma nova migração SQL.
As migrações 05 e 06 já executadas continuam válidas.
