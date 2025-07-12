const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,       // Load từ .env
    pass: process.env.GMAIL_PASSWORD,   // App Password nếu sử dụng 2FA
  },
});

module.exports = transporter;
