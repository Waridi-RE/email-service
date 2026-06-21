// services/email.service.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SPACESHIP_SMTP_HOST,
  port: process.env.SPACESHIP_SMTP_PORT,
  auth: {
    user: process.env.SPACESHIP_SMTP_USER,
    pass: process.env.SPACESHIP_SMTP_PASS,
  },
});

async function sendEmail({ to, subject, html, text }) {
  const mailOptions = {
    from: process.env.SPACESHIP_FROM_EMAIL,
    to,
    subject,
    html,
    text,
  };
  const info = await transporter.sendMail(mailOptions);
  return info;
}

module.exports = { sendEmail };
