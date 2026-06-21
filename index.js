// index.js
const dotenv = require('dotenv');

dotenv.config();

const { connectRabbitMQ } = require('./rabbitmq/connection');
const { startEmailConsumer } = require('./rabbitmq/consumer');
const { publishEmailJob } = require('./rabbitmq/producer');


async function init() {
  try {
    await connectRabbitMQ();
    await startEmailConsumer();
    console.log('🚀 Email queue system ready.');

    // Expose producer for use in API routes
    const express = require('express');
    const app = express();
    app.use(express.json());

    // Example endpoint to queue an email
    app.post('/api/send-email', async (req, res) => {
      const { to, subject, html, text } = req.body;
      if (!to) return res.status(400).json({ error: 'Missing "to" field' });
      await publishEmailJob({ to, subject, html, text });
      res.json({ message: 'Email queued' });
    });

    const PORT = process.env.PORT || 3006;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Initialization failed:', err);
    process.exit(1);
  }
}

init();
