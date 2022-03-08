const amqp = require('amqplib')


// Cria a conexão com o RabbitMQ
const connection = await amqp.connect({
    protocol: 'amqp',
    hostname: 'localhost',
    username: 'admin',
    password: 'admin',
    port: 5672
});


// Cria o canal de sessão de comunicação
const channel = await connection.createChannel();
channel.prefetch(1);


const QUEUE_NAME = 'MAIL_USER_WELCOME_QUEUE';


// Confirma ou cria a Queue
await channel.assertQueue(QUEUE_NAME, { durable: false });

// Consome as mensagens da fila
channel.consume(QUEUE_NAME, function(msg) {

    const dados = JSON.parse(msg.content.toString());
    if(!dados instanceof Object) {
        channel.reject(msg); // reject() quando o formato da mensagem está errada
        console.log(" [x] Rejected %s", dados.id);
        return;
    }
    console.log(` [${QUEUE_NAME}] Received: ${dados.user_name}`);

    try {
        // Define um caso de erro para análise do comportamento do nack()
        if(dados.email.includes('uk')) {
            throw 'invalid email uk'
        }

        console.log(` [${QUEUE_NAME}] Send email to %s`, dados.email);
        channel.ack(msg); //ack() quando a mensagem foi processada com sucesso
    } catch (e) {
        channel.nack(msg); //nack() quando houver erro no processamento
        console.error(` [${QUEUE_NAME}] Error on process %s`, dados.email);
    }

}, {
    noAck: false // Define que a confirmação do processamento da mensagem deve ser feito manualmente, usando channel.ack(msg)
});

console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", QUEUE_NAME);