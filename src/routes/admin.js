const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
  next();
};

// ── EXISTING STATS ──────────────────────────────────────────
router.get('/stats/users', auth, adminOnly, async (req, res) => {
  const result = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'resident'");
  res.json({ count: parseInt(result.rows[0].count) });
});
router.get('/stats/providers', auth, adminOnly, async (req, res) => {
  const result = await pool.query('SELECT COUNT(*) FROM service_providers');
  res.json({ count: parseInt(result.rows[0].count) });
});
router.get('/stats/orders', auth, adminOnly, async (req, res) => {
  const result = await pool.query('SELECT COUNT(*) FROM grocery_orders');
  res.json({ count: parseInt(result.rows[0].count) });
});
router.get('/stats/rides', auth, adminOnly, async (req, res) => {
  const result = await pool.query('SELECT COUNT(*) FROM ride_bookings');
  res.json({ count: parseInt(result.rows[0].count) });
});
router.get('/stats/repairs', auth, adminOnly, async (req, res) => {
  const result = await pool.query('SELECT COUNT(*) FROM repair_requests');
  res.json({ count: parseInt(result.rows[0].count) });
});
router.get('/users', auth, adminOnly, async (req, res) => {
  const result = await pool.query(
    'SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC'
  );
  res.json(result.rows);
});
router.get('/providers', auth, adminOnly, async (req, res) => {
  const result = await pool.query(`
    SELECT sp.id, u.full_name, u.email, sp.service_type, sp.is_available
    FROM service_providers sp
    JOIN users u ON sp.user_id = u.id
    ORDER BY u.full_name
  `);
  res.json(result.rows);
});

// ── REPORTS & ANALYTICS ─────────────────────────────────────

// Overall summary
router.get('/reports/summary', auth, adminOnly, async (req, res) => {
  try {
    const [users, providers, orders, rides, repairs, reviews] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'resident'"),
      pool.query('SELECT COUNT(*) FROM service_providers'),
      pool.query('SELECT COUNT(*) FROM grocery_orders'),
      pool.query('SELECT COUNT(*) FROM ride_bookings'),
      pool.query('SELECT COUNT(*) FROM repair_requests'),
      pool.query('SELECT ROUND(AVG(rating), 1) as avg FROM reviews'),
    ])
    res.json({
      users:     parseInt(users.rows[0].count),
      providers: parseInt(providers.rows[0].count),
      orders:    parseInt(orders.rows[0].count),
      rides:     parseInt(rides.rows[0].count),
      repairs:   parseInt(repairs.rows[0].count),
      avg_rating: parseFloat(reviews.rows[0].avg) || 0,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// Orders per day — last 7 days
router.get('/reports/orders-per-day', auth, adminOnly, async (req, res) => {
  try {
    const [orders, rides, repairs] = await Promise.all([
      pool.query(`
        SELECT DATE(ordered_at) as date, COUNT(*) as count
        FROM grocery_orders
        WHERE ordered_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(ordered_at) ORDER BY date
      `),
      pool.query(`
        SELECT DATE(booked_at) as date, COUNT(*) as count
        FROM ride_bookings
        WHERE booked_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(booked_at) ORDER BY date
      `),
      pool.query(`
        SELECT DATE(requested_at) as date, COUNT(*) as count
        FROM repair_requests
        WHERE requested_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(requested_at) ORDER BY date
      `),
    ])
    res.json({
      orders:  orders.rows,
      rides:   rides.rows,
      repairs: repairs.rows,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// Average rating per service
router.get('/reports/ratings', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        service_type,
        ROUND(AVG(rating), 1) as avg_rating,
        COUNT(*) as total_reviews
      FROM reviews
      GROUP BY service_type
    `)
    res.json({ ratings: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// Top rated providers
router.get('/reports/top-providers', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.full_name,
        sp.service_type,
        ROUND(AVG(r.rating), 1) as avg_rating,
        COUNT(r.id) as total_reviews
      FROM reviews r
      JOIN service_providers sp ON sp.id = r.provider_id
      JOIN users u ON u.id = sp.user_id
      GROUP BY u.full_name, sp.service_type
      ORDER BY avg_rating DESC, total_reviews DESC
      LIMIT 5
    `)
    res.json({ providers: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// Status breakdown per service
router.get('/reports/status-breakdown', auth, adminOnly, async (req, res) => {
  try {
    const [orders, rides, repairs] = await Promise.all([
      pool.query(`
        SELECT status, COUNT(*) as count 
        FROM grocery_orders GROUP BY status
      `),
      pool.query(`
        SELECT status, COUNT(*) as count 
        FROM ride_bookings GROUP BY status
      `),
      pool.query(`
        SELECT status, COUNT(*) as count 
        FROM repair_requests GROUP BY status
      `),
    ])
    res.json({
      orders:  orders.rows,
      rides:   rides.rows,
      repairs: repairs.rows,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router;