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
