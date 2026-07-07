// rabbitmq/consumer.js
const { getChannel, connectRabbitMQ } = require('./connection');
const { sendEmail } = require('../services/email.service');
const { EMAIL_QUEUE } = process.env;

let isConsuming = false;

async function startEmailConsumer() {
  try {
    const channel = getChannel();
    channel.prefetch(1);

    // Handle channel errors
    channel.on('error', (err) => {
      console.error('Channel error:', err);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        console.log('🔄 Attempting to restart consumer...');
        startEmailConsumer();
      }, 5000);
    });

    channel.consume(EMAIL_QUEUE, async (msg) => {
      if (!msg) return;

      const emailData = JSON.parse(msg.content.toString());
      console.log(`📬 Processing email for ${emailData.to}`);

      try {
        await sendEmail(emailData);
        console.log(`✅ Email sent to ${emailData.to}`);
        channel.ack(msg);
      } catch (err) {
        console.error(`❌ Failed to send email to ${emailData.to}:`, err.message);

        const retryCount = (msg.properties.headers?.retryCount || 0) + 1;
        if (retryCount < 3) {
          channel.nack(msg, false, true);
          console.log(`🔄 Retry ${retryCount} for ${emailData.to}`);
        } else {
          channel.nack(msg, false, false);
          console.log(`💀 Email moved to dead-letter for ${emailData.to}`);
        }
      }
    }, { noAck: false });

    isConsuming = true;
    console.log('👂 Waiting for email jobs...');
  } catch (err) {
    console.error('❌ Failed to start consumer:', err);
    // Retry after 5 seconds
    setTimeout(() => {
      console.log('🔄 Retrying consumer start...');
      startEmailConsumer();
    }, 5000);
  }
}

module.exports = { startEmailConsumer };
