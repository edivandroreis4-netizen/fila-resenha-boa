# Correção V4 — remoção definitiva do cliente cancelado

O teste da V3 confirmou que o agendamento ficava como `cancelado`, mas uma
condição de corrida da sincronização poderia recolocar a entrada antiga na
fila.

A V4 aplica a regra em todos os pontos de sincronização:

1. a leitura da fila consulta os agendamentos simultaneamente;
2. entradas ligadas a agendamentos cancelados não são aplicadas ao painel;
3. antes de enviar a fila local, o sistema consulta os cancelamentos no banco;
4. um cliente cancelado nunca é reenviado para a tabela `fila`;
5. a limpeza complementar da V3 permanece ativa.

Não é necessário executar uma nova migração SQL.
As migrações 05 e 06 continuam válidas.
