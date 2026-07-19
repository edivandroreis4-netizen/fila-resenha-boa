# Teste — expediente e disponibilidade do profissional

## Preparação

1. Execute `supabase/06-expediente-e-disponibilidade.sql`.
2. Publique esta versão em uma prévia da Vercel.
3. Abra o painel do barbeiro e o aplicativo do cliente em navegadores ou aparelhos diferentes.
4. Selecione o mesmo profissional nos dois aplicativos.

## Cenário 1 — iniciar expediente

1. No painel do barbeiro, toque em **Iniciar expediente**.
2. Confirme a operação.
3. No aplicativo do cliente, observe o card do profissional.

Resultado esperado:

- selo **Recebendo clientes**;
- card habilitado;
- serviço selecionável;
- novo pré-agendamento aceito.

## Cenário 2 — fechar para novos clientes

1. Coloque pelo menos dois clientes na fila.
2. No painel do barbeiro, toque em **Fechar para novos clientes**.
3. Confirme que a fila atual será preservada.

Resultado esperado:

- os clientes que já estavam na fila continuam acompanhando suas posições;
- o card permanece visível no aplicativo do cliente;
- selo **Fechado para novos clientes**;
- o botão do profissional fica bloqueado;
- nenhum novo pedido é aceito;
- a posição dos clientes existentes continua sendo atualizada.

## Cenário 3 — tentativa simultânea

1. Deixe o profissional como **Recebendo clientes**.
2. No aplicativo do cliente, preencha um novo pedido.
3. Antes de enviar, encerre o expediente no painel do barbeiro.
4. Envie o formulário já preenchido.

Resultado esperado:

- o Supabase recusa o pedido;
- aparece a mensagem de expediente encerrado;
- nenhum agendamento inválido é criado.

## Cenário 4 — encerrar expediente com fila

1. Mantenha clientes aguardando.
2. Toque em **Encerrar expediente**.
3. Leia o aviso e confirme.

Resultado esperado:

- novos pedidos ficam bloqueados;
- a fila atual não é apagada;
- atendimentos em andamento continuam;
- os clientes existentes continuam vendo posição e alertas.

## Cenário 5 — novo dia

1. Mantenha o expediente aberto em um dia.
2. No banco de teste, altere `expediente_data` para uma data anterior.
3. Reabra o painel e o aplicativo do cliente.

Resultado esperado:

- o profissional aparece como indisponível;
- o painel oferece **Iniciar expediente**;
- o cliente não consegue criar pedido até a reabertura.

## Cenário 6 — Realtime

1. Deixe cliente e barbeiro abertos simultaneamente.
2. Alterne entre:
   - Recebendo clientes;
   - Fechado para novos clientes;
   - Expediente encerrado.

Resultado esperado:

- o card do cliente muda sem recarregar;
- o botão de agendamento acompanha o status;
- nenhuma solicitação existente é cancelada.

## Critérios de aprovação

- profissional encerrado não recebe pedido;
- card continua visível;
- fila existente é preservada;
- mudança aparece em tempo real;
- validação ocorre também no banco;
- posição e cancelamento continuam funcionando;
- PWA recupera o estado ao reabrir.
