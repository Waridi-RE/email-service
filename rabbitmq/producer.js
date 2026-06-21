const { getChannel } = require('./connection');
const { EMAIL_QUEUE } = process.env;

async function publishEmailJob(emailData) {
  const channel = getChannel();
  const message = Buffer.from(JSON.stringify(emailData));
  channel.sendToQueue(EMAIL_QUEUE, message, {
    persistent: true,
    contentType: 'application/json',
  });
  console.log(`📨 Email job published for ${emailData.to}`);
}

module.exports = { publishEmailJob };
