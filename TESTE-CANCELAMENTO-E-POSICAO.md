# Teste — cancelamento e posição na fila

## Preparação obrigatória

1. Execute `supabase/05-cancelamento-cliente-e-fila.sql` no SQL Editor.
2. Publique a versão em uma branch de teste ou prévia da Vercel.
3. Use o aplicativo do barbeiro e pelo menos dois aparelhos/perfis de cliente.

## Cenário 1 — cancelar antes da fila

1. Cliente A envia um pré-agendamento.
2. Toque em **Cancelar solicitação**.
3. Escolha um motivo opcional e confirme.
4. Confirme:
   - status **Cancelado** no cliente;
   - atualização imediata no painel do barbeiro;
   - botão **Fazer novo pedido** disponível;
   - registro preservado no histórico de agendamentos.

## Cenário 2 — barbeiro escolhido por engano

1. Envie um pedido para um profissional.
2. Cancele com o motivo **Escolhi o profissional errado**.
3. Toque em **Fazer novo pedido**.
4. Confirme que a seleção de profissional foi reiniciada.

## Cenário 3 — sair da fila e recalcular posições

1. Adicione os clientes A, B e C à fila, nessa ordem.
2. Confirme as posições 1ª, 2ª e 3ª.
3. No cliente B, toque em **Sair da fila** e confirme.
4. Confirme:
   - B fica **Cancelado**;
   - a entrada de B é removida da tabela `fila`;
   - C passa automaticamente da 3ª para a 2ª posição;
   - nomes e telefones dos demais clientes continuam ocultos.

## Cenário 4 — cancelamento na primeira posição

1. Coloque um cliente na 1ª posição.
2. Cancele antes do início do atendimento.
3. Confirme que o próximo cliente passa para 1ª posição e recebe o alerta **Você é o próximo**.

## Cenário 5 — bloqueio após início

1. Inicie o atendimento do cliente A.
2. Confirme que o botão de cancelamento não aparece no aplicativo do cliente.
3. Caso a função seja acionada por tentativa externa, confirme que o banco bloqueia com a mensagem de atendimento já iniciado.

## Cenário 6 — atualização em tempo real

Mantenha o painel do barbeiro e dois clientes abertos. Nenhuma tela deve precisar ser recarregada manualmente após cancelamento ou alteração da fila.

## Observação de segurança

O token privado impede cancelamentos acidentais por outro aparelho no fluxo normal. As políticas atuais do projeto ainda são provisórias para testes. Antes da comercialização, conclua autenticação e RLS por perfil para bloquear alterações diretas fora dos fluxos autorizados.
