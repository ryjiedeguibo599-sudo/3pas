const express = require('express')
const router = express.Router()
const pool = require('../config/db')
const auth = require('../middleware/auth')

// CREATE REPAIR REQUEST
router.post('/requests', auth, async (req, res) => {
  try {
    const { description, address, repair_type, photo_urls, problem_title, schedule } = req.body
    const user_id = req.user.id

    const request = await pool.query(
      `INSERT INTO repair_requests 
        (user_id, description, address, repair_type, problem_title, schedule, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
      [user_id, description, address, repair_type || null, problem_title || null, schedule || 'As soon as possible']
    )
    const request_id = request.rows[0].id

    if (photo_urls && photo_urls.length > 0) {
      for (const url of photo_urls) {
        await pool.query(
          `INSERT INTO repair_photos (request_id, photo_url) VALUES ($1, $2)`,
          [request_id, url]
        )
      }
    }

    // NOTIFY PROVIDERS
    const io = req.app.get('io')
    io.to('provider_room').emit('notification', {
      title: '🔧 Bagong Repair Request!',
      message: `May bagong ${repair_type || 'repair'} request sa ${address}.`,
      type: 'new_repair'
    })

    res.status(201).json({ message: 'Repair request created!', request: request.rows[0] })
  // BAGO — para makita ang exact na DB error
} catch (err) {
  console.error('=== REPAIR REQUEST DB ERROR ===')
  console.error('Message:', err.message)
  console.error('Detail:', err.detail)
  console.error('Code:', err.code)
  console.error('Table:', err.table)
  console.error('Column:', err.column)
  res.status(500).json({ 
    message: err.message,  // pansamantala — para makita sa mobile
    detail: err.detail,
    code: err.code
  })
}
})

// GET ALL REQUESTS NG USER
router.get('/requests', auth, async (req, res) => {
  try {
    const user_id = req.user.id
    const requests = await pool.query(
      `SELECT r.*, json_agg(p.photo_url) as photos
       FROM repair_requests r
       LEFT JOIN repair_photos p ON p.request_id = r.id
       WHERE r.user_id = $1
       GROUP BY r.id
       ORDER BY r.requested_at DESC`,
      [user_id]
    )
    res.json({ requests: requests.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// CANCEL REPAIR REQUEST
router.patch('/requests/:id/cancel', auth, async (req, res) => {
  try {
    const { id }  = req.params
    const user_id = req.user.id

    const check = await pool.query(
      `SELECT * FROM repair_requests WHERE id = $1 AND user_id = $2`,
      [id, user_id]
    )

    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Repair request not found.' })
    }

    if (check.rows[0].status !== 'pending') {
      return res.status(400).json({ message: 'Hindi na pwedeng i-cancel. Accepted na ang repair request.' })
    }

    const request = await pool.query(
      `UPDATE repair_requests SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [id]
    )

    const io = req.app.get('io')
    io.to('provider_room').emit('notification', {
      title: '❌ Repair Request Cancelled',
      message: `Repair Request #${id} ay na-cancel ng user.`,
      type: 'repair_cancelled'
    })
    io.to('admin_room').emit('notification', {
      title: '❌ Repair Request Cancelled',
      message: `Repair Request #${id} ay na-cancel ng user.`,
      type: 'admin_update'
    })

    res.json({ message: 'Repair request cancelled successfully!', request: request.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// UPDATE REQUEST STATUS
router.patch('/requests/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params
    const { status, provider_id } = req.body

    const request = await pool.query(
      `UPDATE repair_requests SET status = $1, provider_id = $2 WHERE id = $3 RETURNING *`,
      [status, provider_id, id]
    )

    const updated = request.rows[0]
    const io = req.app.get('io')

    const MESSAGES = {
      accepted:    { title: '🔧 Repair Accepted!',    message: 'May technician na ang iyong repair request!' },
      in_progress: { title: '🔧 Repair In Progress!', message: 'Ine-ayos na ng technician ang iyong problema.' },
      completed:   { title: '✅ Repair Completed!',   message: 'Tapos na ang repair. Mag-rate ka na!' },
      cancelled:   { title: '❌ Repair Cancelled',    message: 'Na-cancel ang iyong repair request.' }
    }

    if (MESSAGES[status]) {
      io.to(`user_${updated.user_id}`).emit('notification', {
        ...MESSAGES[status],
        type: `repair_${status}`,
        service: 'parepair',
        service_id: updated.id
      })
    }

    io.to('admin_room').emit('notification', {
      title: '🔧 Repair Status Update',
      message: `Repair Request #${updated.id} is now ${status}`,
      type: 'admin_update'
    })

    res.json({ message: 'Request status updated!', request: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET ALL PENDING REQUESTS (PROVIDER)
router.get('/requests/provider/all', auth, async (req, res) => {
  try {
    const requests = await pool.query(
      `SELECT r.*, u.full_name as customer_name, u.phone as customer_phone,
        json_agg(p.photo_url) as photos
       FROM repair_requests r
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN repair_photos p ON p.request_id = r.id
       WHERE r.status = 'pending'
       GROUP BY r.id, u.full_name, u.phone
       ORDER BY r.requested_at DESC`
    )
    res.json({ requests: requests.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router