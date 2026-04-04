const express = require('express')
const router  = express.Router()
const pool    = require('../config/db')
const auth    = require('../middleware/auth')

// CREATE ORDER
router.post('/orders', auth, async (req, res) => {
  try {
    const { items, total_amount } = req.body
    const user_id = req.user.id
    const order = await pool.query(
      `INSERT INTO grocery_orders (user_id, total_amount, status) 
       VALUES ($1, $2, 'pending') RETURNING *`,
      [user_id, total_amount]
    )
    const order_id = order.rows[0].id
    for (const item of items) {
      await pool.query(
        `INSERT INTO order_items (order_id, item_name, quantity, price) 
         VALUES ($1, $2, $3, $4)`,
        [order_id, item.item_name, item.quantity, item.price]
      )
    }

    const io = req.app.get('io')
    io.to('provider_room').emit('notification', {
      title:   '🛒 Bagong Grocery Order!',
      message: 'May bagong order na naghihintay ng shopper.',
      type:    'new_order'
    })

    res.status(201).json({ message: 'Order created successfully!', order: order.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET ALL ORDERS NG USER
router.get('/orders', auth, async (req, res) => {
  try {
    const user_id = req.user.id
    const orders  = await pool.query(
      `SELECT o.*, json_agg(i.*) as items
       FROM grocery_orders o
       LEFT JOIN order_items i ON i.order_id = o.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.ordered_at DESC`,
      [user_id]
    )
    res.json({ orders: orders.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET SINGLE ORDER
router.get('/orders/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    const order   = await pool.query(
      `SELECT o.*, json_agg(i.*) as items
       FROM grocery_orders o
       LEFT JOIN order_items i ON i.order_id = o.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id]
    )
    if (order.rows.length === 0)
      return res.status(404).json({ message: 'Order not found' })
    res.json({ order: order.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// ✅ CANCEL ORDER — resident lang, pending lang pwedeng i-cancel
router.patch('/orders/:id/cancel', auth, async (req, res) => {
  try {
    const { id }  = req.params
    const user_id = req.user.id

    // 1. I-check kung exists at pag-aari ng user
    const check = await pool.query(
      `SELECT * FROM grocery_orders WHERE id = $1 AND user_id = $2`,
      [id, user_id]
    )
    if (check.rows.length === 0)
      return res.status(404).json({ message: 'Order not found' })

    // 2. Pwede lang mag-cancel kung pending pa
    const order = check.rows[0]
    if (order.status !== 'pending')
      return res.status(400).json({ message: 'Hindi na pwedeng i-cancel — accepted na ang order.' })

    // 3. I-update ang status
    const updated = await pool.query(
      `UPDATE grocery_orders SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [id]
    )

    // 4. Notify via Socket.io
    const io = req.app.get('io')
    io.to(`user_${user_id}`).emit('notification', {
      title:   '❌ Order Cancelled',
      message: `Na-cancel ang iyong Grocery Order #${id}.`,
      type:    'order_cancelled',
      service: 'pasabuy',
      service_id: parseInt(id)
    })

    res.json({ message: 'Order cancelled successfully!', order: updated.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// UPDATE ORDER STATUS (provider)
router.patch('/orders/:id/status', auth, async (req, res) => {
  try {
    const { id }     = req.params
    const { status } = req.body

    const order   = await pool.query(
      `UPDATE grocery_orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    )
    const updated = order.rows[0]
    const io      = req.app.get('io')

    const MESSAGES = {
      accepted:  { title: '🛒 Order Accepted!',  message: 'May shopper na ang iyong grocery order!' },
      picked_up: { title: '🛍️ Order Picked Up!', message: 'Pinitas na ang iyong mga items. Paparating na!' },
      completed: { title: '✅ Order Completed!',  message: 'Nai-deliver na ang iyong order. Mag-rate ka na!' },
      cancelled: { title: '❌ Order Cancelled',   message: 'Na-cancel ang iyong grocery order.' },
    }

    if (MESSAGES[status]) {
      io.to(`user_${updated.user_id}`).emit('notification', {
        ...MESSAGES[status],
        type:       `order_${status}`,
        service:    'pasabuy',
        service_id: updated.id
      })
    }

    io.to('admin_room').emit('notification', {
      title:   '📦 Order Status Update',
      message: `Grocery Order #${updated.id} is now ${status}`,
      type:    'admin_update'
    })

    res.json({ message: 'Order status updated!', order: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET ALL ORDERS (PROVIDER)
router.get('/orders/provider/all', auth, async (req, res) => {
  try {
    const orders = await pool.query(
      `SELECT o.*, u.full_name as customer_name, u.phone as customer_phone,
        json_agg(i.*) as items
       FROM grocery_orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN order_items i ON i.order_id = o.id
       WHERE o.status = 'pending'
       GROUP BY o.id, u.full_name, u.phone
       ORDER BY o.ordered_at DESC`
    )
    res.json({ orders: orders.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router