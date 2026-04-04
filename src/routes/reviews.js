const express = require('express')
const router = express.Router()
const pool = require('../config/db')
const auth = require('../middleware/auth')

// POST A REVIEW
router.post('/', auth, async (req, res) => {
  try {
    const { service_type, service_id, rating, comment } = req.body
    const user_id = req.user.id

    // Check if already reviewed
    const existing = await pool.query(
      `SELECT id FROM reviews
       WHERE user_id = $1 AND service_type = $2 AND service_id = $3`,
      [user_id, service_type, service_id]
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Na-review mo na ito!' })
    }

    // Check if service is completed
    let isCompleted = false

    if (service_type === 'pasabuy') {
      const order = await pool.query(
        `SELECT status FROM grocery_orders WHERE id = $1 AND user_id = $2`,
        [service_id, user_id]
      )
      isCompleted = order.rows[0]?.status === 'completed'
    } else if (service_type === 'pasakay') {
      const ride = await pool.query(
        `SELECT status FROM ride_bookings WHERE id = $1 AND user_id = $2`,
        [service_id, user_id]
      )
      isCompleted = ride.rows[0]?.status === 'completed'
    } else if (service_type === 'parepair') {
      const repair = await pool.query(
        `SELECT status FROM repair_requests WHERE id = $1 AND user_id = $2`,
        [service_id, user_id]
      )
      isCompleted = repair.rows[0]?.status === 'completed'
    }

    if (!isCompleted) {
      return res.status(400).json({ message: 'Hindi pa completed ang service!' })
    }

    const review = await pool.query(
      `INSERT INTO reviews (user_id, service_type, service_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, service_type, service_id, rating, comment]
    )

    res.status(201).json({
      message: 'Salamat sa review mo!',
      review: review.rows[0]
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET REVIEW NG ISANG SERVICE
router.get('/:service_type/:service_id', auth, async (req, res) => {
  try {
    const { service_type, service_id } = req.params
    const user_id = req.user.id

    const review = await pool.query(
      `SELECT * FROM reviews
       WHERE user_id = $1 AND service_type = $2 AND service_id = $3`,
      [user_id, service_type, service_id]
    )

    res.json({ review: review.rows[0] || null })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET ALL REVIEWS (ADMIN)
router.get('/admin/all', auth, async (req, res) => {
  try {
    const reviews = await pool.query(
      `SELECT r.*, u.full_name as reviewer_name
       FROM reviews r
       LEFT JOIN users u ON u.id = r.user_id
       ORDER BY r.created_at DESC`
    )

    res.json({ reviews: reviews.rows })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router