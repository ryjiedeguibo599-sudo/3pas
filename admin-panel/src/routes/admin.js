const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Middleware: admin only
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
  next();
};

// Stats
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

// Users list
router.get('/users', auth, adminOnly, async (req, res) => {
  const result = await pool.query('SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC');
  res.json(result.rows);
});

// Providers list
router.get('/providers', auth, adminOnly, async (req, res) => {
  const result = await pool.query(`
    SELECT sp.id, u.full_name, u.email, sp.service_type, sp.phone_number, sp.is_available
    FROM service_providers sp
    JOIN users u ON sp.user_id = u.id
    ORDER BY u.full_name
  `);
  res.json(result.rows);
});

module.exports = router;