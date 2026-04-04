// 📁 src/middleware/authMiddleware.js

const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Walang token. Hindi awtorisado.' })

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: decoded.id }
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid o expired na token. Mag-login ulit.' })
  }
}