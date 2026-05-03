const http = require('http')

const data = JSON.stringify({ email: 'ryjiedeguibo599@gmail.com' })

const req = http.request(
  'http://localhost:5000/api/auth/send-otp',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  },
  (res) => {
    let body = ''
    res.on('data', d => body += d)
    res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body))
  }
)

req.on('error', e => console.error(e))
req.write(data)
req.end()
