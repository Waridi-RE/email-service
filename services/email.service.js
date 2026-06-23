// services/email.service.js
const { Resend } = require('resend');
const dns = require('dns');

// Force Node.js DNS lookups to prioritize IPv4 addresses over IPv6 globally
dns.setDefaultResultOrder('ipv4first');


const resend = new Resend(process.env.RESEND_API_KEY || 're_your_api_key');

async function sendEmail({ to, subject, html, text }) {
  try {
    const data = await resend.emails.send({
      from: process.env.SPACESHIP_FROM_EMAIL,
      to: [to],
      subject: subject,
      html: html,
      text: text,
    });
    
    return data;
  } catch (error) {
    throw new Error(`API Email delivery failed: ${error.message}`);
  }
}

module.exports = { sendEmail };
