const express = require('express')
const router = express.Router()
const pool = require('../config/db')
const auth = require('../middleware/auth')

// ✅ SPECIFIC ROUTES MUNA — bago ang :id routes

// GET AVAILABLE RIDES (PROVIDER) — KAILANGAN NAUNA ITO
router.get('/rides/available/all', auth, async (req, res) => {
  try {
    const rides = await pool.query(
      `SELECT r.*, u.full_name as customer_name, u.phone as customer_phone
       FROM ride_bookings r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.status = 'pending'
       ORDER BY r.booked_at DESC`
    )
    res.json({ rides: rides.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// BOOK A RIDE
router.post('/book', auth, async (req, res) => {
  try {
    const { pickup_location, dropoff_location, fare } = req.body
    const user_id = req.user.id

    const ride = await pool.query(
      `INSERT INTO ride_bookings (user_id, pickup_location, dropoff_location, fare, status) 
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [user_id, pickup_location, dropoff_location, fare]
    )

    const io = req.app.get('io')
    io.to('provider_room').emit('notification', {
      title: '🛵 Bagong Ride Booking!',
      message: `May bagong ride request mula sa ${pickup_location}.`,
      type: 'new_ride'
    })

    res.status(201).json({ message: 'Ride booked successfully!', ride: ride.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET ALL RIDES NG USER
router.get('/rides', auth, async (req, res) => {
  try {
    const user_id = req.user.id
    const rides = await pool.query(
      `SELECT r.*, u.full_name as rider_name, u.phone as rider_phone
       FROM ride_bookings r
       LEFT JOIN service_providers sp ON sp.id = r.rider_id
       LEFT JOIN users u ON u.id = sp.user_id
       WHERE r.user_id = $1
       ORDER BY r.booked_at DESC`,
      [user_id]
    )
    res.json({ rides: rides.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// ✅ DYNAMIC :id ROUTES — HULI PALAGI

// CANCEL RIDE
router.patch('/rides/:id/cancel', auth, async (req, res) => {
  try {
    const { id } = req.params
    const user_id = req.user.id

    const check = await pool.query(
      `SELECT * FROM ride_bookings WHERE id = $1 AND user_id = $2`,
      [id, user_id]
    )

    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Ride not found.' })
    }

    if (check.rows[0].status !== 'pending') {
      return res.status(400).json({ message: 'Hindi na pwedeng i-cancel. Accepted na ang ride.' })
    }

    const ride = await pool.query(
      `UPDATE ride_bookings SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [id]
    )

    const io = req.app.get('io')
    io.to('provider_room').emit('notification', {
      title: '❌ Ride Cancelled',
      message: `Ride #${id} ay na-cancel ng user.`,
      type: 'ride_cancelled'
    })
    io.to('admin_room').emit('notification', {
      title: '❌ Ride Cancelled',
      message: `Ride #${id} ay na-cancel ng user.`,
      type: 'admin_update'
    })

    res.json({ message: 'Ride cancelled successfully!', ride: ride.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// UPDATE RIDE STATUS
router.patch('/rides/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params
    const { status, rider_id } = req.body

    const ride = await pool.query(
      `UPDATE ride_bookings SET status = $1, rider_id = $2 WHERE id = $3 RETURNING *`,
      [status, rider_id, id]
    )

    const updated = ride.rows[0]
    const io = req.app.get('io')

    const MESSAGES = {
      accepted:   { title: '🛵 Ride Accepted!',    message: 'May rider na ang iyong booking. Paparating na!' },
      on_the_way: { title: '🛵 Rider On the Way!', message: 'Papunta na ang iyong rider sa pickup point mo!' },
      completed:  { title: '✅ Ride Completed!',   message: 'Salamat sa paggamit ng Pasakay! Mag-rate ka na.' },
      cancelled:  { title: '❌ Ride Cancelled',    message: 'Na-cancel ang iyong ride booking.' }
    }

    if (MESSAGES[status]) {
      io.to(`user_${updated.user_id}`).emit('notification', {
        ...MESSAGES[status],
        type: `ride_${status}`,
        service: 'pasakay',
        service_id: updated.id
      })
    }

    io.to('admin_room').emit('notification', {
      title: '🛵 Ride Status Update',
      message: `Ride #${updated.id} is now ${status}`,
      type: 'admin_update'
    })

    res.json({ message: 'Ride status updated!', ride: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// UPDATE LIVE LOCATION
router.post('/rides/:id/location', auth, async (req, res) => {
  try {
    const { id } = req.params
    const { latitude, longitude } = req.body

    const location = await pool.query(
      `INSERT INTO ride_locations (ride_id, latitude, longitude) 
       VALUES ($1, $2, $3) RETURNING *`,
      [id, latitude, longitude]
    )

    const ride = await pool.query(
      `SELECT user_id FROM ride_bookings WHERE id = $1`, [id]
    )

    const io = req.app.get('io')
    io.to(`user_${ride.rows[0].user_id}`).emit('location_updated', {
      ride_id: id, latitude, longitude
    })

    res.json({ message: 'Location updated!', location: location.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router