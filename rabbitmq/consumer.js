// rabbitmq/consumer.js
const { getChannel } = require('./connection');
const { sendEmail } = require('../services/email.service');
const { EMAIL_QUEUE, DEAD_LETTER_QUEUE } = process.env;

async function startEmailConsumer() {
  const channel = getChannel();

  // Prefetch 1 job at a time to avoid overloading
  channel.prefetch(1);

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

      // Retry logic: if retry count < 3, requeue; else dead-letter
      const retryCount = (msg.properties.headers?.retryCount || 0) + 1;
      if (retryCount < 3) {
        // Reject and requeue with incremented retry count
        channel.nack(msg, false, true); // requeue
        console.log(`🔄 Retry ${retryCount} for ${emailData.to}`);
      } else {
        // Move to dead-letter queue
        channel.nack(msg, false, false);
        console.log(`💀 Email sent to dead-letter for ${emailData.to}`);
        // Optionally, you could also publish to a separate DLX exchange
        // but we already set it up via queue args.
      }
    }
  }, { noAck: false });

  console.log('👂 Waiting for email jobs...');
}

module.exports = { startEmailConsumer };
