# Fase futura — notificações push e QR Code de presença

## Notificações push

A futura implementação exigirá:

- permissão explícita do cliente;
- Service Worker dedicado;
- armazenamento das inscrições push;
- função de servidor/Edge Function para enviar mensagens;
- regras para evitar notificações repetidas;
- opção para o cliente desativar os avisos.

## QR Code de presença

O fluxo recomendado será:

1. QR Code fixo na recepção;
2. link público de confirmação;
3. cliente informa telefone ou recupera o agendamento salvo;
4. aplicativo marca `status_presenca = presente`;
5. barbeiro valida e adiciona o cliente ao final da fila.

O QR Code não deverá conter chave secreta, senha ou credencial administrativa.

## Regra preservada

A presença confirmada não garante posição. A ordem da fila continuará sendo definida pela chegada validada pelo profissional.
