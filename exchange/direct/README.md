# Exchange: DIRECT

---
Sabendo que _Exchanges_ são roteadores de mensagens, 
_exchanges_ do tipo _DIRECT_ fazem o roteamento da mensagem para a _queue_ anexada com a `route key` EXATAMENTE igual a `route key` da mensagem.

```javascript
// Cria a exchange do tipo DIRECT
channel.assertExchange('EMAIL_EX', 'direct', { durable: false });

// Cria a Queue
channel.assertQueue('MAIL_USER_WELCOME_QUEUE', { durable: false });

// Anexa a Queue na Exchange, informando a Rounting Key 'USER_SIGN_IN'
// Essa configuração fará com que a exchange roteie a mensagem para essa queue, 
// caso a Rounting Key da mensagem for exatamente iguial a 'USER_SIGN_IN'
channel.bindQueue('MAIL_USER_WELCOME_QUEUE', 'EMAIL_EX', 'USER_SIGN_IN');

// Envia a mensagem para a exchange usando a Routing Key 'USER_SIGN_IN', 
// fazendo com que todas as queues associadas à exatamente essa mesma Rounting Key receba a mensagem
channel.publish('EMAIL_EX', 'USER_SIGN_IN', Buffer.from(JSON.stringify({ user_name: 'John', email: 'john@mail.com' })));
```

### Analogia:
Considere que a Exchange seja um EventManager, onde Listeners (Queues) se registram nesse gerenciador 
informando o nome do evento (Rounting Key) que querem escutar. Quando um evento for disparado, 
o EventManager irá verificar quais são os listener que estão associados à aquele evento, e irá enviar os dados para eles.   


