# Teste — posição do cliente na fila

## Preparação

Use o mesmo profissional em todos os testes e abra:

- aplicativo do barbeiro;
- aplicativo do cliente A;
- aplicativo do cliente B;
- opcionalmente, aplicativo do cliente C.

Use navegadores, perfis ou aparelhos diferentes para que cada cliente
tenha seu próprio acompanhamento salvo.

## Cenário 1 — entrada e posição numérica

1. Crie os pré-agendamentos A e B.
2. Confirme a presença dos dois clientes.
3. No aplicativo do barbeiro, adicione A e depois B à fila.
4. Verifique:
   - cliente A: **1ª posição / Você é o próximo**;
   - cliente B: **2ª posição / 1 pessoa à sua frente**.

## Cenário 2 — atualização automática

1. Inicie o atendimento do cliente A.
2. Verifique no cliente A:
   - **Seu atendimento foi iniciado**.
3. Verifique no cliente B, sem recarregar:
   - passou para **1ª posição**;
   - apareceu **Você é o próximo**;
   - alerta visual foi exibido;
   - som e vibração ocorreram, quando permitidos.

## Cenário 3 — remoção da fila

1. Adicione um terceiro cliente.
2. Remova ou finalize um cliente que esteja à frente.
3. Confirme que as posições restantes diminuem automaticamente.

## Cenário 4 — persistência

1. Feche e reabra o PWA do cliente que está na fila.
2. Verifique se a posição atual é carregada novamente.

## Cenário 5 — privacidade

Confirme que o aplicativo do cliente não mostra:

- nomes dos outros clientes;
- telefones;
- serviços dos outros clientes.

## Resultado esperado

A posição deve ser calculada somente para a fila do profissional escolhido,
pela ordem de entrada. O cliente em atendimento não conta como pessoa à
frente na lista de espera.
