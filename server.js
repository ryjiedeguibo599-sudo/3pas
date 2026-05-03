const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
require('dotenv').config()

const reviewRoutes  = require('./src/routes/reviews')
const db            = require('./src/config/db')
const authRoutes    = require('./src/routes/auth')
const pasabuyRoutes = require('./src/routes/pasabuy')
const pasakayRoutes = require('./src/routes/pasakay')
const parepairRoutes = require('./src/routes/padala')
const adminRoutes   = require('./src/routes/admin')
const providerRoutes = require('./src/routes/provider')
const chatRoutes    = require('./src/routes/chat')

const app    = express()
const server = http.createServer(app)
const io     = new Server(server, {
  cors: { origin: '*' }
})

app.use(cors())
app.use(express.json())

// ✅ I-share ang io sa lahat ng routes
app.set('io', io)

// Routes
app.use('/api/reviews',  reviewRoutes)
app.use('/api/auth',     authRoutes)
app.use('/api/pasabuy',  pasabuyRoutes)
app.use('/api/pasakay',  pasakayRoutes)
app.use('/api/parepair', parepairRoutes)
app.use('/api/admin',    adminRoutes)
app.use('/api/provider', providerRoutes)
app.use('/api/chat',     chatRoutes)

app.get('/', (req, res) => {
  res.json({
    message: '3PS Backend is running!',
    services: ['PasaBUY', 'Pasakay', 'PaRepair']
  })
})

// ✅ Socket.io — Room-based (per user)
const userSockets = {}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Resident/Provider mag-jo-join sa sariling room gamit ang user_id
  socket.on('join', async (userId) => {
    socket.join(`user_${userId}`)
    userSockets[socket.id] = userId
    try {
      const db = require('./src/config/db')
      await db.query('UPDATE users SET is_online = true WHERE id = $1', [userId])
    } catch (e) { console.error('Failed to set online status', e) }
    console.log(`User ${userId} joined room user_${userId} and marked online`)
  })

  // Para sa providers — join provider room
  socket.on('join_provider', (providerId) => {
    socket.join(`provider_${providerId}`)
    console.log(`Provider ${providerId} joined provider room`)
  })

  // Para sa pasabuy order room
  socket.on('join_order_room', ({ orderId }) => {
    socket.join(`order_${orderId}`)
    console.log(`Joined order room: order_${orderId}`)
  })

  // Para sa admin
  socket.on('join_admin', () => {
    socket.join('admin_room')
    console.log('Admin joined admin_room')
  })

  socket.on('update_location', (data) => {
    io.to(`user_${data.userId}`).emit('location_updated', data)
  })

  socket.on('send_message', async (data) => {
    try {
      const db = require('./src/config/db')
      const result = await db.query(
        `INSERT INTO chat_messages (sender_id, receiver_id, service_type, service_id, message) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [data.sender_id, data.receiver_id, data.service_type, data.service_id, data.message]
      )
      const msg = result.rows[0]
      io.to(`user_${data.receiver_id}`).emit('receive_message', msg)
      io.to(`user_${data.sender_id}`).emit('receive_message', msg)
    } catch (err) {
      console.error('Socket send_message error:', err)
    }
  })

  socket.on('disconnect', async () => {
    const userId = userSockets[socket.id]
    if (userId) {
      try {
        const db = require('./src/config/db')
        await db.query('UPDATE users SET is_online = false WHERE id = $1', [userId])
      } catch (e) { console.error('Failed to set offline status', e) }
      delete userSockets[socket.id]
    }
    console.log('User disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`3PS Server running on port ${PORT}`)
})