// 📁 src/config/mailer.js

const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
})

const sendOTP = async (email, otp) => {
  await transporter.sendMail({
    from: `"3PS App" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: '3PS — Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f0fdfa; border-radius: 12px;">
        <h2 style="color: #0D6B63; margin-bottom: 8px;">3PS App</h2>
        <p style="color: #111827; font-size: 15px;">Ito ang iyong verification code:</p>
        <div style="background: #fff; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; border: 2px solid #0D6B63;">
          <span style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #0D6B63;">${otp}</span>
        </div>
        <p style="color: #6B7280; font-size: 13px;">Expires in <strong>10 minutes</strong>. Huwag ibahagi sa iba.</p>
        <p style="color: #9CA3AF; font-size: 11px; margin-top: 24px;">Kung hindi ikaw ang nag-request nito, ignore mo lang ang email na ito.</p>
      </div>
    `,
  })
}

module.exports = { sendOTP }