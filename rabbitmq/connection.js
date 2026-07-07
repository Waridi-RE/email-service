// rabbitmq/connection.js
const amqp = require('amqplib');

let connection = null;
let channel = null;
const RETRY_INTERVAL = 5000;

async function connectRabbitMQ(retries = 5) {
  try {
    const url = process.env.RABBITMQ_URL || 'amqp://localhost';
    connection = await amqp.connect(url);
    channel = await connection.createChannel();

    // Declare exchanges and queues (as before)
    await channel.assertExchange('email-exchange', 'direct', { durable: true });
    await channel.assertExchange('email-dlx', 'direct', { durable: true });
    await channel.assertQueue(process.env.EMAIL_QUEUE, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'email-dlx',
        'x-dead-letter-routing-key': process.env.DEAD_LETTER_QUEUE,
        'x-message-ttl': 60000,
      },
    });
    await channel.bindQueue(process.env.EMAIL_QUEUE, 'email-exchange', '');
    await channel.assertQueue(process.env.DEAD_LETTER_QUEUE, { durable: true });
    await channel.bindQueue(process.env.DEAD_LETTER_QUEUE, 'email-dlx', process.env.DEAD_LETTER_QUEUE);

    // Handle connection close
    connection.on('close', () => {
      console.warn('⚠️ RabbitMQ connection closed. Reconnecting...');
      setTimeout(() => {
        connectRabbitMQ().then(() => {
          // Optionally restart consumer if needed
        });
      }, RETRY_INTERVAL);
    });

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
