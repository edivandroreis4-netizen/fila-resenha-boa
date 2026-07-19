# Fila Resenha Boa — Supabase + aplicativo do cliente

Esta versão preserva o funcionamento atual com `localStorage` e adiciona uma camada opcional de Supabase. Sem configuração, o app continua em **Modo local**.

## Entregue nesta versão

- sincronização de profissional, serviços, clientes, fila, atendimentos e fechamentos;
- migração manual dos dados já existentes no aparelho;
- atualização em tempo real de fila, serviços e agendamentos;
- nova seção **Agendamentos** no app do barbeiro;
- aplicativo do cliente disponível em `/cliente/`;
- confirmação de chegada que adiciona o cliente ao final da fila;
- aviso obrigatório: **atendimento por ordem de chegada**;
- funcionamento local preservado quando a internet ou o Supabase não estiverem disponíveis.

## Configuração

Consulte `supabase/LEIA-ME-ANTES-DE-USAR.md`.

## Segurança

Esta é uma versão de testes sem autenticação. As políticas SQL de teste devem ser substituídas na fase de login e painel administrativo.

## Autoria

Desenvolvido por Edivandro Lima.


## Ajustes finais do fluxo Supabase

Foram implementados:

- forma de pagamento obrigatória ao finalizar;
- opções Pix, Dinheiro, Débito e Crédito;
- bloqueio da finalização enquanto o pagamento não for informado;
- atualização do agendamento para `concluido`;
- data de conclusão gravada em `concluido_em`;
- tela Agendamentos atualizada automaticamente;
- selo verde **Atendido**;
- agendamentos concluídos preservados no histórico;
- filtro específico **Atendidos**;
- remoção dos concluídos da lista de pendentes.

### Banco já criado

Antes de testar esta versão, execute uma única vez no SQL Editor:

```text
supabase/02-ajuste-status-concluido.sql
```

Depois substitua os arquivos do projeto e limpe o cache da PWA.


## Presença do cliente e foto do profissional

Esta versão inclui:

- foto do profissional no aplicativo do cliente;
- painel para acompanhar o último pré-agendamento;
- botão **Estou a caminho**;
- botão **Já estou na barbearia**;
- atualização em tempo real do status de presença;
- aviso interno quando a estimativa estiver entre 10 e 5 minutos;
- alerta no aplicativo do barbeiro quando o cliente ainda não confirmou presença;
- nenhum cliente é removido ou reposicionado automaticamente;
- a confirmação do cliente não adiciona diretamente à fila;
- o barbeiro continua responsável por validar a chegada;
- a regra de ordem de chegada permanece visível.

### Atualização obrigatória do banco

Execute uma única vez:

```text
supabase/03-presenca-e-aviso-proximidade.sql
```

### Limite atual do aviso

O aviso desta etapa funciona **dentro do aplicativo aberto**. Notificações push em segundo plano e confirmação por QR Code foram documentadas como fase futura e ainda não estão ativadas.


## Cards dos cinco profissionais e alerta corrigido

### Aplicativo dos barbeiros

- Cada aparelho continua associado ao perfil configurado nele.
- Ao alterar nome ou foto em **Configurações**, o perfil é sincronizado com o Supabase.
- A mensagem de confirmação informa que a foto será enviada ao aplicativo do cliente.

### Aplicativo do cliente

- Todos os profissionais ativos aparecem automaticamente em cards.
- Não é necessário abrir uma lista para visualizar as fotos.
- Cada card exibe o nome e até três serviços do profissional.
- Ao tocar no card, somente os serviços daquele barbeiro ficam disponíveis.
- Quando não existe foto cadastrada, a área da imagem permanece vazia e neutra.
- Alterações de nome, foto e serviços são recebidas em tempo real.

### Alerta do profissional

O alerta foi corrigido para:

- funcionar em qualquer tela do aplicativo do barbeiro;
- aparecer quando o atendimento atual entra nos últimos 10 minutos;
- ficar urgente quando restam 5 minutos ou menos;
- localizar agendamentos do dia sem confirmação de presença;
- tocar o som configurado e vibrar uma única vez por faixa;
- abrir diretamente a tela **Agendamentos**;
- nunca remover ou reposicionar clientes automaticamente.

Esta atualização não exige uma nova migração SQL.


## Fotos compactas e lembrete do cliente

Esta versão acrescenta:

- fotos circulares e compactas nos cards dos profissionais;
- 76 px no desktop e 60 px no celular;
- enquadramento ajustado para destacar melhor o rosto;
- card sem foto continua com área neutra e vazia;
- lembrete persistente no aplicativo do cliente;
- alerta amarelo quando restam até 10 minutos;
- alerta vermelho quando restam 5 minutos ou menos;
- botões **Estou a caminho** e **Já estou na barbearia** dentro do lembrete;
- som discreto e vibração quando permitidos pelo navegador;
- somente um aviso por faixa de tempo, evitando repetição contínua;
- lembrete removido imediatamente após a confirmação.

O lembrete funciona com o aplicativo aberto ou ativo no navegador.
Notificações com o aplicativo fechado continuam reservadas para a fase de Push Notifications.

Esta atualização não exige nova migração SQL.


## Refinamento do acompanhamento e do alerta

### Aplicativo do cliente

- Atendimentos concluídos exibem **Atendido** e **Presença confirmada**.
- Os botões **Estou a caminho** e **Já estou na barbearia** são removidos de forma obrigatória após a conclusão.
- O lembrete de proximidade desaparece imediatamente depois de selecionar **Estou a caminho** ou **Já estou na barbearia**.
- Quando o cliente começa a preencher um novo pré-agendamento, o acompanhamento concluído anterior é descartado da tela e do armazenamento local.
- O histórico do atendimento continua preservado no Supabase.

### Aplicativo do barbeiro

- O alerta de falta de confirmação agora usa `position: fixed`.
- Ele permanece visível em qualquer tela e em qualquer posição da rolagem.
- O alerta continua amarelo até a faixa urgente e vermelho com 5 minutos ou menos.
- O botão **Ver agendamentos** permanece disponível.

Esta atualização não exige nova migração SQL.


## Correção crítica — agendamento marcado como Na fila com fila vazia

A correção altera o fluxo de confirmação de chegada:

1. o cliente conhecido é salvo;
2. os serviços e clientes são sincronizados antes da fila;
3. a entrada da fila é confirmada no Supabase;
4. somente depois o agendamento recebe o status `na_fila`;
5. em caso de erro, a inclusão local é desfeita.

A tela de agendamentos também identifica registros antigos que estejam
marcados como **Na fila**, mas sem uma entrada correspondente. Nesses casos,
é exibido o botão **Recolocar na fila**.

Esta atualização não exige uma nova migração SQL.


## Ajustes de acabamento — alertas e Pedido enviado

### Aplicativo do cliente

- O aviso interno duplicado foi removido.
- O lembrete flutuante permanece como único aviso de proximidade.
- O cartão **Pedido enviado** agora orienta o cliente a usar os botões
  no acompanhamento acima.
- O cartão **Pedido enviado** é ocultado automaticamente assim que o cliente
  marca **Estou a caminho**, **Já estou na barbearia**, entra na fila, é
  atendido ou tem o pedido cancelado.

### Aplicativo do barbeiro

- O alerta duplicado dentro da tela **Agendamentos** foi removido.
- O alerta global fixo permanece como único alerta visual.
- Som, vibração, mudança de cor e botão **Ver agendamentos** foram preservados.

Esta atualização não exige nova migração SQL.


## Fluxo simplificado de presença

O estado **Estou a caminho** foi removido das novas operações.

Fluxo atual:

```text
Agendado
→ Confirmar presença
→ Validação do barbeiro
→ Na fila
→ Em atendimento
→ Atendido
```

O pré-agendamento continua vinculado diretamente ao profissional escolhido.
A confirmação do cliente informa que ele chegou, mas a entrada na fila ainda
é validada pelo barbeiro para preservar a ordem real de chegada.

### Atualização obrigatória do banco

Execute uma única vez:

```text
supabase/04-fluxo-presenca-simplificado.sql
```

A migração converte registros antigos com `a_caminho` para
`nao_confirmado` e remove esse estado da restrição do banco.

## Busca global e organização de dados

O aplicativo do barbeiro possui uma **Central de dados** acessível pelo botão
**Busca global** no cabeçalho ou pelo atalho `Ctrl + K`.

A busca cobre:

- fila atual;
- agendamentos;
- clientes cadastrados;
- histórico de atendimentos;
- serviços.

Os dados podem ser:

- filtrados por categoria;
- ordenados por relevância;
- ordenados pelos registros mais recentes;
- organizados em ordem alfabética.

Ao selecionar um resultado, o sistema abre a área correspondente e destaca
o registro localizado.


## Refinamento — uma única ação de confirmação

No aplicativo do cliente:

- quando o lembrete flutuante de proximidade abre, o botão
  **Confirmar presença** do card de acompanhamento é ocultado;
- o lembrete flutuante passa a ser o único ponto de confirmação;
- quando o lembrete fecha sem confirmação, o botão normal do card é
  restaurado automaticamente;
- após confirmar presença, ambos permanecem ocultos porque a ação já
  foi concluída;
- o comportamento também é aplicado aos estados **Na fila** e
  **Atendido**.

Esta atualização não exige nova migração SQL.


## Posição do cliente na fila em tempo real

O aplicativo do cliente agora mostra a posição depois que o barbeiro
valida a chegada e adiciona o agendamento à fila.

Informações exibidas:

- posição numérica;
- quantidade de pessoas à frente;
- indicação **Você é o próximo**;
- estado **Seu atendimento foi iniciado**;
- horário da última atualização.

A posição considera somente a fila do profissional escolhido e utiliza
a ordem de `entrada_em`. Nenhum nome, telefone ou serviço de outro cliente
é exibido.

### Atualização automática

A posição é recalculada:

- por eventos Realtime do Supabase na tabela `fila`;
- a cada 15 segundos como mecanismo de segurança;
- quando o agendamento muda de estado.

### Alerta de primeira posição

Ao chegar à primeira posição, o cliente recebe:

- alerta visual fixo;
- mensagem na tela;
- vibração, quando permitida pelo aparelho;
- aviso sonoro, quando permitido pelo navegador.

Esta implementação usa a tabela `fila` existente e não exige nova
migração SQL.


## Cancelamento pelo cliente

Esta versão inclui **Cancelar solicitação** antes da fila e **Sair da fila** enquanto o cliente ainda aguarda. O cancelamento preserva o agendamento como histórico, remove somente a entrada transitória da fila e dispara o recálculo das posições pelo Supabase Realtime.

Antes de testar, execute `supabase/05-cancelamento-cliente-e-fila.sql`. O atendimento em andamento não pode ser cancelado pelo aplicativo do cliente.


## Controle de expediente e disponibilidade

Esta versão adiciona três estados por profissional:

- `recebendo_clientes`;
- `fechado_novos_clientes`;
- `expediente_encerrado`.

O card do profissional permanece visível no aplicativo do cliente, mas
somente o estado `recebendo_clientes` permite criar novas solicitações.

A criação do agendamento utiliza a função
`criar_agendamento_cliente`, que valida novamente o status no Supabase.
Isso impede um pedido quando o profissional encerra o expediente entre a
seleção do card e o envio do formulário.

Antes dos testes, execute:

```text
supabase/06-expediente-e-disponibilidade.sql
```

Consulte também:

```text
TESTE-EXPEDIENTE-E-DISPONIBILIDADE.md
```
