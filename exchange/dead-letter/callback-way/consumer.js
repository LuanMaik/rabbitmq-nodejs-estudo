const amqp = require('amqplib/callback_api')

/**
 * Este parâmetro é essencial para analisarmos o uso de Dead Letters.
 * True: recoloca a mensagem na mesma fila de origem
 * False: remove a mensagem da fila e envia para a Dead Letter
 * @type {boolean}
 */
const recolocarNaFila = false;

amqp.connect({
    protocol: 'amqp',
    hostname: 'localhost',
    username: 'admin',
    password: 'admin',
    port: 5672
}, function(error0, connection) {
    if (error0) {
        console.log("Erro ao criar a conexão");
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            console.log("Erro ao criar o channel");
            throw error1;
        }
        const EXCHANGE_DEADLETTER_NAME = 'EMAIL_EX_DEAD';
        const QUEUE_NAME  = 'MAIL_USER_WELCOME_QUEUE';
        const ROUNTING_KEY  = 'USER_SIGN_IN';

        channel.assertQueue(QUEUE_NAME, {
            durable: false,
            arguments: {
                'x-dead-letter-exchange': EXCHANGE_DEADLETTER_NAME,  // specify dead letter exchange
                'x-dead-letter-routing-key': ROUNTING_KEY
            }
        });

        // PREFETCH:
        // É a quantidade de mensagens que serão extraídas da fila e jogadas para a memória do consumer.
        // O problema de deixar um valor alto, é que dificulta escalar os consumidores,
        // pois várias mensagens já estariam na memória de um único consumer.
        // O problema de deixar um valor muito baixo, é que sacrificará no throughput,
        // dado que o consumidor perderá mais tempo solicitando novas mensagens
        // https://youtu.be/bDzi4xMPZ-8?t=229  QOS - Luiz Carlos Faria
        // https://gago.io/blog/rabbitmq-guia-estudo-gratuito-2021/
        channel.prefetch(1);


        channel.consume(QUEUE_NAME, function(msg) {

            const dados = JSON.parse(msg.content.toString());
            if(!dados instanceof Object) {
                channel.reject(msg, recolocarNaFila); // reject() quando o formato da mensagem está errada
                console.log(" [x] Rejected %s", dados.id);
                return;
            }

            console.log(` [${QUEUE_NAME}] Received: ${dados.user_name}`);

            try {
                // Define um caso de erro para análise das mensagens sendo enviadas para a dead letter
                if(dados.email.includes('uk')) {
                    throw 'email inválido: ' + dados.email
                }
                console.log(` [${QUEUE_NAME}] Send email to %s`, dados.email);
                channel.ack(msg); //ack quando a mensagem foi processada com sucesso
            } catch (e) {
                channel.nack(msg, recolocarNaFila); //nack quando houver erro no processamento
                console.error(` [${QUEUE_NAME}] Error on process %s (${e})`, dados.user_name);
            }

        }, {
            noAck: false // Define que a confirmação do processamento da mensagem deve ser feito manualmente, usando channel.ack(msg)
        });

        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", QUEUE_NAME);
    });
});