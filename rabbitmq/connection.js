const amqp = require('amqplib');

let connection = null;
let channel = null;
const RETRY_INTERVAL = 5000;

async function connectRabbitMQ(retries = 5) {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();

    // ✅ Declare exchanges first
    await channel.assertExchange('email-exchange', 'direct', { durable: true });
    await channel.assertExchange('email-dlx', 'direct', { durable: true }); 

    // Main queue with dead-letter config
    await channel.assertQueue(process.env.EMAIL_QUEUE, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'email-dlx',
        'x-dead-letter-routing-key': process.env.DEAD_LETTER_QUEUE,
        'x-message-ttl': 60000,
      },
    });
    await channel.bindQueue(process.env.EMAIL_QUEUE, 'email-exchange', '');

    // Dead-letter queue
    await channel.assertQueue(process.env.DEAD_LETTER_QUEUE, { durable: true });
    await channel.bindQueue(process.env.DEAD_LETTER_QUEUE, 'email-dlx', process.env.DEAD_LETTER_QUEUE);

    console.log('✅ RabbitMQ connected and queues ready.');
    return { connection, channel };
  } catch (err) {
    if (retries > 0) {
      console.log(`⚠️ RabbitMQ connection failed. Retrying in ${RETRY_INTERVAL/1000}s... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      return connectRabbitMQ(retries - 1);
    }
    throw err;
  }
}

function getChannel() {
  if (!channel) throw new Error('RabbitMQ channel not initialized');
  return channel;
}

module.exports = { connectRabbitMQ, getChannel };
