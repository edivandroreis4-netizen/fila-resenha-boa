# Fila Resenha Boa — versão 1.3

Aplicativo web individual para o barbeiro controlar sua fila, seus atendimentos, serviços, preços e faturamento.

## Novidades da versão 1.3

- Cabeçalho reorganizado:
  - Painel de atendimento
  - Profissional: nome configurado
- Confirmação antes de alterar o profissional
- Edição de cliente na fila
- SweetAlert2 para confirmações mais profissionais
- Proteção do histórico exigindo a palavra `APAGAR`
- Horário de entrada automático
- Tempo de espera atualizado em tempo real
- Botão para iniciar atendimento
- Cronômetro de atendimento
- Duração registrada no histórico
- Filtro do histórico por data
- Calendário mensal com quantidade de atendimentos e faturamento por dia
- Resumo diário
- Totais por forma de pagamento
- Quantidade e total por serviço
- Fechamento do dia
- Impressão do resumo
- Possibilidade de salvar o relatório como PDF pela janela de impressão
- Menu de ações compacto em telas pequenas

## Funcionalidades principais

- Cadastro de clientes
- Nome e WhatsApp
- Serviços e preços editáveis
- Forma de pagamento
- Fila independente por profissional
- Mensagem pronta no WhatsApp
- Edição e remoção de clientes
- Reorganização da fila
- Histórico local
- Faturamento diário
- Ticket médio
- Tempo médio de atendimento
- PWA instalável
- Layout responsivo
- Identidade visual da Barbearia Resenha Boa

## Como executar

A PWA e o Service Worker precisam de um servidor local.

### VS Code com Live Server

1. Extraia o arquivo ZIP.
2. Abra a pasta no VS Code.
3. Instale a extensão **Live Server**.
4. Clique com o botão direito em `index.html`.
5. Escolha **Open with Live Server**.

### Terminal com Python

Dentro da pasta:

```bash
python -m http.server 5500
```

Depois acesse:

```text
http://localhost:5500
```

## Como salvar o fechamento em PDF

1. Abra a seção **Fechamento**.
2. Escolha a data.
3. Clique em **Imprimir / salvar PDF**.
4. Na janela de impressão do navegador, selecione **Salvar como PDF**.

## Armazenamento

Os dados continuam no `localStorage` do navegador.

Cada celular possui:

- seu profissional;
- sua fila;
- seus serviços e preços;
- seu histórico;
- seus fechamentos;
- seu faturamento.

Limpar os dados do navegador ou trocar de aparelho pode apagar os registros. Esta versão não possui backup online.

## Observação sobre SweetAlert2

As confirmações usam SweetAlert2 por CDN. Na primeira abertura, é necessário estar conectado à internet para carregar a biblioteca. O restante da aplicação funciona com os arquivos locais e o cache da PWA.

Desenvolvido por Edivandro Lima.


## Ajustes da versão 1.3.1

- Removida a barra de rolagem horizontal das abas no celular.
- Navegação mobile reorganizada em grade.
- Calendário com dias clicáveis.
- Ao tocar em uma data, abre um resumo com:
  - clientes atendidos;
  - serviços;
  - valores;
  - forma de pagamento;
  - duração;
  - horário de finalização.
- A partir do resumo do dia, é possível:
  - abrir o histórico já filtrado;
  - abrir o fechamento da data selecionada.


## Ajustes visuais adicionais

- Ampulheta no tempo de espera.
- Ampulheta animada durante o atendimento.
- Animação desativada automaticamente quando o usuário prefere menos movimento.
- Nome **Edivandro Lima** com maior destaque no rodapé.
- Identificação da versão removida da interface.


## Novidades da versão 1.4

- Nova aba **Clientes**.
- Cadastro permanente de clientes recorrentes.
- Busca por nome ou telefone.
- Serviço habitual.
- Pagamento preferido.
- Campo de observações.
- Edição e exclusão do cadastro.
- Botão **Adicionar à fila**.
- Confirmação de serviço e pagamento antes de entrar na fila.
- Bloqueio para evitar o mesmo cliente duas vezes na fila.
- Registro automático da última visita.
- Ícone do aplicativo baseado no logotipo da Barbearia Resenha Boa.
- Ícones PWA padrão, maskable e Apple Touch Icon.


## Resumo mensal

O calendário agora mostra automaticamente, para o mês selecionado:

- total de atendimentos;
- faturamento mensal;
- ticket médio;
- tempo médio de atendimento;
- total por forma de pagamento;
- quantidade e faturamento por serviço.

Ao navegar para o mês anterior ou seguinte, todos os indicadores são recalculados automaticamente.


## Tempo previsto por atendimento

Antes de iniciar, o barbeiro escolhe 15, 30, 45, 60 minutos ou um tempo personalizado entre 1 e 240 minutos.

Durante o atendimento, o sistema exibe o tempo decorrido e a contagem regressiva. Ao chegar a zero, tenta emitir som, vibrar o celular e mostra um alerta com as opções **Finalizar** ou **Adicionar 5 min**.

O alerta é mais confiável quando o aplicativo está aberto ou em primeiro plano. Alguns celulares limitam som e execução quando a tela está bloqueada ou o aplicativo está totalmente fechado.


## Efeito visual no botão principal

O botão **Adicionar à fila** recebeu brilho externo, pulso, leve escala no hover e foco acessível. A animação é desativada para usuários que preferem menos movimento.


## Perfil e sons personalizados

- Foto média do profissional no cabeçalho.
- Upload de JPG, PNG ou WebP.
- Limite de 1 MB.
- Redimensionamento automático.
- Foto salva no próprio aparelho.
- Foto pequena do desenvolvedor no rodapé.
- Bip suave, bip duplo, campainha digital e alerta forte.
- Controle de volume.
- Botão **Testar som**.
- Opção **Somente vibrar**.
- Preferências salvas no localStorage.

A imagem `assets/images/edivandro-lima.jpg` é provisória, com as iniciais EL. Para usar a foto real, substitua esse arquivo mantendo o mesmo nome.


## Correção da foto do profissional

- Corrigida a atualização da foto no cabeçalho e na prévia.
- A foto agora é salva imediatamente no localStorage.
- Arquivos de até 5 MB podem ser selecionados.
- A imagem é redimensionada e comprimida automaticamente antes de ser armazenada.


## Foto do desenvolvedor

A foto real de Edivandro Lima foi adicionada ao rodapé em:

```text
assets/images/edivandro-lima.jpg
```

A imagem foi recortada em formato quadrado e otimizada para carregamento rápido.


## Cabeçalho e configurações reorganizados

- Logotipo da barbearia à esquerda.
- Foto do profissional ao lado do logotipo.
- Nome do profissional com maior destaque.
- Removido o botão grande **Alterar profissional** do cabeçalho.
- Edição do nome movida para **Configurações do profissional**.
- Edição e remoção da foto permanecem apenas em Configurações.
- Cabeçalho mobile mais compacto.
- Texto do limite da foto atualizado para 5 MB.


## Dashboard premium

A tela inicial foi redesenhada com aparência de aplicativo comercial:

- saudação personalizada;
- resumo inteligente do dia;
- quatro indicadores principais;
- próximo cliente em destaque;
- atendimento atual com cronômetro e barra de progresso;
- gráfico dos últimos sete dias;
- recebimentos por forma de pagamento;
- ranking de serviços;
- clientes frequentes;
- formulário rápido para adicionar à fila;
- navegação inferior no celular;
- identidade visual da Barbearia Resenha Boa;
- rodapé preservado com a foto e autoria de Edivandro Lima.

A edição do nome e da foto do profissional permanece somente em **Configurações**.


## Correção para nomes longos no celular

- O nome do cliente agora pode ocupar toda a largura do card.
- Nomes longos quebram para a linha seguinte sem serem cortados.
- No modo vertical, o selo de status aparece abaixo do nome.
- O comportamento no computador permanece organizado.


## Correções mobile adicionais

- Calendário voltou a ficar acessível pelo botão **Mais** na barra inferior.
- Menu **Mais** reúne Serviços, Calendário, Fechamento e Configurações.
- Menu **Mais ações** agora abre dentro da largura da tela, sem corte lateral.
- Cursores de clique foram aplicados aos elementos interativos no computador.
- Foto do profissional ficou no canto esquerdo e o logotipo da barbearia no canto direito.
- Cache da PWA atualizado.


## Ajustes no dashboard mobile

- O logotipo da Barbearia Resenha Boa permanece visível no canto direito do card de saudação.
- O logotipo recebeu tamanho adaptativo para telas menores.
- O menu **Mais** agora possui uma opção explícita **Recolher menu**.
- O botão **X**, o toque fora da aba e o próprio botão **Mais** continuam fechando o menu.


## Correção do menu Mais ações

- Adicionado o botão **Voltar** dentro do menu de ações de cada cliente.
- O botão recolhe imediatamente a aba no celular e no computador.
- Tocar fora do menu também fecha a aba.
- A tecla `Esc` fecha o menu no computador.
- Ao abrir um novo menu, qualquer outro menu de ações aberto é recolhido.


## Refinamento do card de saudação

- Mantido somente o logotipo principal no cabeçalho.
- Removido o logotipo destacado do card de saudação.
- Adicionada uma marca-d'água maior e parcialmente cortada no canto.
- A marca-d'água utiliza baixa opacidade, sem borda branca e sem competir com o conteúdo.
- O comportamento foi ajustado separadamente para computador e celular.


## Feedback de salvamento e retorno ao atendimento

- Ao salvar as configurações de som, o botão muda temporariamente para **Configurações salvas**.
- Uma confirmação leve aparece abaixo do formulário.
- O formulário recebe uma animação discreta, sem interromper o uso.
- As configurações são gravadas imediatamente no `localStorage`.
- Ao iniciar um atendimento, o aplicativo volta automaticamente para a tela **Fila**.
- O cliente em atendimento é levado para a área visível e recebe um destaque temporário.
- Animações respeitam a preferência de movimento reduzido do aparelho.


## Correção do início de atendimento

- O botão **Iniciar atendimento** da tela de tempo previsto agora executa a ação diretamente.
- Removida a segunda confirmação que podia ficar escondida atrás da janela de duração.
- Depois de iniciar, o aplicativo abre automaticamente a tela **Início**.
- O card **Atendimento atual** é centralizado e recebe um destaque discreto.
- O botão apresenta o texto **Iniciando...** para evitar dúvidas e cliques repetidos.
- O cronômetro e o tempo restante continuam funcionando normalmente.
