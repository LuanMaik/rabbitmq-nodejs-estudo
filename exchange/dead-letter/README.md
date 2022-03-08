# Dead Letter

Documentação oficial: https://www.rabbitmq.com/dlx.html

A `dead letter` é a especificação que pode ser adicionada à configuração da `queue`, definindo para onde a mensagem deve ir
quando sofrer um `nack` ou `reject` somado ao parâmetro de remoção da mensagem da fila.

### Como configurar a Dead Letter de uma Queue:
```javascript
// Producer.js

const ROUNTING_KEY  = 'user_sign_in';


/*************************************************
 * CONFIGURAÇÃO DA EXCHANGE E QUEUE DEAD LETTER
 ************************************************/

const EXCHANGE_DEADLETTER_NAME = 'email_dead_ex';
const QUEUE_DEADLETTER_NAME    = 'mail_user_welcome_dead_queue';

// Cria a exchange e a queue que serão usadas como dead letter
channel.assertExchange(EXCHANGE_DEADLETTER_NAME, 'direct', { durable: false });
channel.assertQueue(QUEUE_DEADLETTER_NAME, { durable: false });
// Anexa a Queue na Exchange e define a RountingKey que fará que a exchange envie a mensagem para a queue
channel.bindQueue(QUEUE_DEADLETTER_NAME, EXCHANGE_DEADLETTER_NAME, ROUNTING_KEY);


/*************************************************
 * CONFIGURAÇÃO DA EXCHANGE E QUEUE PRINCIPAIS
 ************************************************/

const EXCHANGE_NAME = 'email_ex';
const QUEUE_NAME    = 'mail_user_welcome_queue';

// Cria a Exchange principal e uma dead letter
channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: false });
// Cria a Queue principal com os dados de sua dead letter
channel.assertQueue(QUEUE_NAME, {
    durable: false,
    arguments: {
        'x-dead-letter-exchange': EXCHANGE_DEADLETTER_NAME,  // specify dead letter exchange
        'x-dead-letter-routing-key': ROUNTING_KEY
    }
});
// Anexa a Queue na Exchange e define a RountingKey que fará que a exchange envie a mensagem para a queue
channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUNTING_KEY);

// Publica a mensagem na Exchange
channel.publish(EXCHANGE_NAME, ROUNTING_KEY, Buffer.from(JSON.stringify({messagem: 'test'})));
```

### Como enviar a mensagem para a Dead Letter:
```javascript
// Consumer.js

// nack: quando houver um problema no processamento da mensagem
channel.nack(msg, false, false); // o terceiro parâmetro informa para NÃO recolocar a mensagem na fila

// reject: quando a mensagem estiver em um formato inválido
channel.reject(msg, false); // o segundo parâmetro informa para NÃO recolocar a mensagem na fila
```
Quando a mensagem sofrer um `nack` ou `reject` somado a instrução de retirada da fila, 
o RabbitMQ irá verificar o argumento `x-dead-letter-exchange` existentes na mensagem e fará o envio dela para a 
exchange informada, juntamente com o `rounting key` informado no `x-dead-letter-routing-key`.