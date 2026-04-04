// 📁 src/middleware/auth.js
const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'Walang access token.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded   // { id, role }
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid o expired na token.' })
  }
}