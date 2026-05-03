const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
  next();
};

// ── EXISTING STATS ──────────────────────────────────────────
router.get('/stats/users', auth, adminOnly, adminController.getUsersStats);
router.get('/stats/providers', auth, adminOnly, adminController.getProvidersStats);
router.get('/stats/orders', auth, adminOnly, adminController.getOrdersStats);
router.get('/stats/rides', auth, adminOnly, adminController.getRidesStats);
router.get('/stats/repairs', auth, adminOnly, adminController.getRepairsStats);
router.get('/users', auth, adminOnly, adminController.getUsers);
router.get('/providers', auth, adminOnly, adminController.getProviders);
router.get('/users/:id', auth, adminOnly, adminController.getUserById);
router.delete('/users/:id', auth, adminOnly, adminController.deleteUser);

// ── REPORTS & ANALYTICS ─────────────────────────────────────
router.get('/reports/summary', auth, adminOnly, adminController.getOverallSummary);
router.get('/reports/orders-per-day', auth, adminOnly, adminController.getOrdersPerDay);
router.get('/reports/ratings', auth, adminOnly, adminController.getRatings);
router.get('/reports/top-providers', auth, adminOnly, adminController.getTopProviders);
router.get('/reports/status-breakdown', auth, adminOnly, adminController.getStatusBreakdown);

module.exports = router;