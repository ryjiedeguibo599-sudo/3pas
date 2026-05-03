require('dotenv').config()
const nodemailer = require('nodemailer')

async function testEmail() {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    })
    
    await transporter.verify()
    console.log('Nodemailer verified successfully!')
    
    await transporter.sendMail({
      from: `"3PS Test" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: 'Test Email',
      text: 'This is a test'
    })
    console.log('Test email sent successfully!')
  } catch (error) {
    console.error('Email Error:', error)
  }
}

testEmail()
