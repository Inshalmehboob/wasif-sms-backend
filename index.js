// index.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const twilio = require('twilio');
const rateLimit = require('express-rate-limit');

dotenv.config();
const app = express();

// middlewares
app.use(cors()); // ✅ allow all origins for development
app.use(express.json());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 6
});
app.use('/send-sms', limiter); // limiter applied to the route

// Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Health check
app.get('/', (req, res) => res.send('SMS Backend is running 🚀'));

// Route: accept full contact form (name, phone, etc.)
app.post('/send-sms', async (req, res) => {
  try {
    const { name, company, phone, email, service, details } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required.' });
    }

    const body = [
      '📩 New Contact Request',
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Company: ${company || '-'}`,
      `Email: ${email || '-'}`,
      `Service: ${service || '-'}`,
      `Details: ${details || '-'}`,
    ].join('\n');

    const msg = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.TARGET_PHONE,
    });

    console.log('SMS sent successfully:', msg.sid); // ✅ logs success
    return res.json({ success: true, sid: msg.sid });
  } catch (err) {
    console.error('Error sending SMS:', err); // ✅ logs errors
    return res.status(500).json({ success: false, error: err.message || err });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

