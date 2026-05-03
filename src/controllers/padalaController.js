const pool = require('../config/db')
const { notifyUser, notifyProviders } = require('../utils/pushNotifications')

exports.createRequest = async (req, res) => {
  try {
    const { description, address, delivery_type, photo_urls, item_title, schedule } = req.body
    const user_id = req.user.id

    const request = await pool.query(
      `INSERT INTO delivery_requests 
        (user_id, description, address, delivery_type, item_title, schedule, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
      [user_id, description, address, delivery_type || null, item_title || null, schedule || 'As soon as possible']
    )
    const request_id = request.rows[0].id

    if (photo_urls && photo_urls.length > 0) {
      for (const url of photo_urls) {
        await pool.query(
          `INSERT INTO delivery_photos (request_id, photo_url) VALUES ($1, $2)`,
          [request_id, url]
        )
      }
    }

    const io = req.app.get('io')
    io.to('provider_room').emit('notification', {
      title: '📦 Bagong Delivery Request!',
      message: `May bagong ${delivery_type || 'delivery'} request sa ${address}.`,
      type: 'new_delivery'
    })
    notifyProviders('📦 Bagong Delivery Request!', `May bagong ${delivery_type || 'delivery'} request sa ${address}.`, { type: 'new_delivery' })

    res.status(201).json({ message: 'Delivery request created!', request: request.rows[0] })
  } catch (err) {
    console.error('=== DELIVERY REQUEST DB ERROR ===')
    console.error('Message:', err.message)
    console.error('Detail:', err.detail)
    console.error('Code:', err.code)
    console.error('Table:', err.table)
    console.error('Column:', err.column)
    res.status(500).json({ 
      message: err.message,
      detail: err.detail,
      code: err.code
    })
  }
}

exports.getUserRequests = async (req, res) => {
  try {
    const user_id = req.user.id
    const requests = await pool.query(
      `SELECT r.*, json_agg(p.photo_url) as photos
       FROM delivery_requests r
       LEFT JOIN delivery_photos p ON p.request_id = r.id
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
}

exports.cancelRequest = async (req, res) => {
  try {
    const { id }  = req.params
    const user_id = req.user.id

    const check = await pool.query(
      `SELECT * FROM delivery_requests WHERE id = $1 AND user_id = $2`,
      [id, user_id]
    )

    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Delivery request not found.' })
    }

    if (check.rows[0].status !== 'pending') {
      return res.status(400).json({ message: 'Hindi na pwedeng i-cancel. Accepted na ang delivery request.' })
    }

    const request = await pool.query(
      `UPDATE delivery_requests SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [id]
    )

    const io = req.app.get('io')
    io.to('provider_room').emit('notification', {
      title: '❌ Delivery Request Cancelled',
      message: `Delivery Request #${id} ay na-cancel ng user.`,
      type: 'delivery_cancelled'
    })
    notifyProviders('❌ Delivery Request Cancelled', `Delivery Request #${id} ay na-cancel ng user.`, { type: 'delivery_cancelled' })
    io.to('admin_room').emit('notification', {
      title: '❌ Delivery Request Cancelled',
      message: `Delivery Request #${id} ay na-cancel ng user.`,
      type: 'admin_update'
    })

    res.json({ message: 'Delivery request cancelled successfully!', request: request.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

exports.updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, provider_id } = req.body

    const request = await pool.query(
      `UPDATE delivery_requests SET status = $1, provider_id = $2 WHERE id = $3 RETURNING *`,
      [status, provider_id, id]
    )

    const updated = request.rows[0]
    const io = req.app.get('io')

    const MESSAGES = {
      accepted:    { title: '📦 Delivery Accepted!',    message: 'May provider na ang iyong delivery request!' },
      in_progress: { title: '📦 Delivery In Progress!', message: 'Inihahatid na ng provider ang iyong padala.' },
      completed:   { title: '✅ Delivery Completed!',   message: 'Tapos na ang delivery. Mag-rate ka na!' },
      cancelled:   { title: '❌ Delivery Cancelled',    message: 'Na-cancel ang iyong delivery request.' }
    }

    if (MESSAGES[status]) {
      io.to(`user_${updated.user_id}`).emit('notification', {
        ...MESSAGES[status],
        type: `delivery_${status}`,
        service: 'padala',
        service_id: updated.id
      })
      notifyUser(updated.user_id, MESSAGES[status].title, MESSAGES[status].message, { type: `delivery_${status}`, service: 'padala', service_id: updated.id })
    }

    io.to('admin_room').emit('notification', {
      title: '📦 Delivery Status Update',
      message: `Delivery Request #${updated.id} is now ${status}`,
      type: 'admin_update'
    })

    res.json({ message: 'Request status updated!', request: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

exports.getProviderRequests = async (req, res) => {
  try {
    const requests = await pool.query(
      `SELECT r.*, u.full_name as customer_name, u.phone as customer_phone,
        json_agg(p.photo_url) as photos
       FROM delivery_requests r
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN delivery_photos p ON p.request_id = r.id
       WHERE r.status = 'pending'
       GROUP BY r.id, u.full_name, u.phone
       ORDER BY r.requested_at DESC`
    )
    res.json({ requests: requests.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}
