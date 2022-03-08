# RabbitMQ e NodeJs

No código fonte desse repositório contém alguns exemplos de uso.

## Configurações importantes:

### Prefetch
``` javascript
const channel = await connection.createChannel();
channel.prefetch(1);
```
Define o tamanho do lote de mensagens que será capturado da fila.

Um valor muito baixo causará constantes solicitações do consumer ao rabbitMQ para obter mais mensagens, 
diminuindo o throughput da fila devido ao tempo de comunicação. O baixo throughput também pode fazer com que atinja o 
[limite de mensagens suportado pela fila](https://www.rabbitmq.com/maxlength.html).

Um valor muito alto pode dificultar o escalonamento de consumers numa fila, pois muitas mensagens já estariam alocadas num único consumer.

Mais detalhes: 
- https://youtu.be/bDzi4xMPZ-8?t=229
- https://gago.io/blog/rabbitmq-guia-estudo-gratuito-2021/

---

### Dead Letter
``` javascript
channel.assertQueue('MAIL_USER_WELCOME_QUEUE', {
            durable: false,
            arguments: {
                'x-dead-letter-exchange': 'EMAIL_EX_DEAD',  // specify dead letter exchange
                'x-dead-letter-routing-key': 'USER_SIGN_IN'
            }
        });
```
Define na Queue, qual a `Exchange` e a `Routing Key` que deve ser usada para realocar uma mensagem quando ela sofrer um `nack()` ou `reject()` removendo-a da fila.
``` javascript
const recolocarMensagemNaFila = false;
channel.nack(msg, recolocarMensagemNaFila); //nack() quando houver erro no processamento
// OU
channel.reject(msg, recolocarMensagemNaFila); // reject() quando o formato da mensagem está errada
```
Mais detalhes: https://www.rabbitmq.com/dlx.html

---

### x-single-active-consumer

```javascript
channel.assertQueue(QUEUE_NAME, {
            durable: false,
            arguments: {
                'x-single-active-consumer': true,
            }
        });
```

É um argumento adicionado na definição da queue, possibilitando que apenas 1 consumer possa se conectar na queue.

Ideal para quando a ordem de processamento das mensagens é um critério importante.

Mais detalhes: https://www.rabbitmq.com/consumers.html#single-active-consumer

---

## Links úteis:
- https://www.rabbitmq.com/documentation.html
- https://geshan.com.np/blog/2021/07/rabbitmq-docker-nodejs/
- https://youtu.be/bDzi4xMPZ-8?t=229
- https://gago.io/blog/rabbitmq-guia-estudo-gratuito-2021/


## Casos reais
- https://dev.to/ottonova/how-and-why-we-updated-rabbitmq-queues-on-production-2h76

## Dúvidas:

### 1) Quando já existe uma queue/exchange, como faço editá-la sem perder as mensagens? Exemplo, já existe uma queue em produção, mas agora eu preciso adicionar um argumento definindo a `x-dead-letter-exchange`ou alterar a durabilidade da queue.
???

### 2) Quando o processamento de uma mensagem sofre um `nack` ou `reject` ela é retorna para a queue, mas é retornada para o final da queue?
Não, o rabbit TENTARÁ colocar a mensagem na posição original ou o mais próximo possível, porém, se o `prefetch` do consumer estiver maior que 1, 
pode ser que perceba que mensagens mais antigas sejam processadas antes da mensagem que foi reenviada para a fila, 
pois estas estavam na memória no consumer.

Mais detalhes: https://www.rabbitmq.com/confirms.html#consumer-nacks-requeue


### 3) É possível atualizar os dados do corpo da mensagem já enviada? Como deve ser o procedimento nos casos de mensagens com formatos inválidos?
`Pesquisar mais:` Aparentemente não é possível, neste caso deverá adequar o consumer para tratar essa particularidade ou criar uma nova fila,  
mover as mensagens para ela, depois criar um consumer para ajustar as mensagem e recolocá-las na fila anterior.  

### 4) Como garantir que apenas 1 consumer seja utilizado em uma Queue?
Usando o argumento `x-single-active-consumer: true` na definição da queue.

Mais detalhes: https://www.rabbitmq.com/consumers.html#single-active-consumer

### 5) Tenho várias aplicações, como eu posso separar as exchanges e queues de cada aplicação?
É possível organizar através da criação de um Virtual Host representando cada aplicação, e nela criar as exchanges e queues.

Mais detalhes: https://www.rabbitmq.com/vhosts.html