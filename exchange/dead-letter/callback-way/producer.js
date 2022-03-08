const amqp = require('amqplib/callback_api');
const fakeData = require('chance').Chance();

/**
 * EXEMPLO CASO DE USO:
 * Um novo usuário se cadastrou, e o sistema precisa enviar um email para ele.
 */
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
        const EXCHANGE_NAME = 'EMAIL_EX';
        const EXCHANGE_DEADLETTER_NAME = 'EMAIL_EX_DEAD';

        const QUEUE_NAME    = 'MAIL_USER_WELCOME_QUEUE';
        const QUEUE_DEADLETTER_NAME    = 'MAIL_USER_WELCOME_QUEUE_DEAD';
        const ROUNTING_KEY  = 'USER_SIGN_IN';

        // Confirma ou cria a Exchange do tipo DIRECT
        channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: false });
        channel.assertExchange(EXCHANGE_DEADLETTER_NAME, 'direct', { durable: false });

        // Confirma ou cria a Queue
        channel.assertQueue(QUEUE_NAME, {
            durable: false,
            arguments: {
                'x-dead-letter-exchange': EXCHANGE_DEADLETTER_NAME,  // specify dead letter exchange
                'x-dead-letter-routing-key': ROUNTING_KEY
            }
        });

        // Anexa a Queue na Exchange e define a RountingKey que fará que a exchange envie a mensagem para a queue
        channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUNTING_KEY);

        // Confirma ou cria a Queue de Deadletter
        channel.assertQueue(QUEUE_DEADLETTER_NAME, { durable: false });

        // Anexa a Queue na Exchange e define a RountingKey que fará que a exchange envie a mensagem para a queue
        channel.bindQueue(QUEUE_DEADLETTER_NAME, EXCHANGE_DEADLETTER_NAME, ROUNTING_KEY);

        /**
         * Envia uma nova mensagem a cada 500ms
         * simula o caso de haver 1 novo registro de usuário a cada 500ms
         */
        setInterval(() => {

            // Define os dados da mensagem a ser enviada
            const msg = {
                id: fakeData.guid(),
                user_name: fakeData.name({ nationality: 'it' }),
                email: fakeData.email()
            }

            // Publica a mensagem na Exchange informando a mesma RountingKey especificada no anexo da queue à exchange
            channel.publish(EXCHANGE_NAME, ROUNTING_KEY, Buffer.from(JSON.stringify(msg)));

            console.log("Send message: " + msg.id, msg)
        }, 500)
    });
});