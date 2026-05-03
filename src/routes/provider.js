const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const providerController = require('../controllers/providerController');

// ── PATCH /api/provider/status ────────────────────────────────
// Updates provider online/offline status
router.patch('/status', authMiddleware, providerController.updateStatus);

// ── GET /api/provider/stats ───────────────────────────────────
// Returns pending, completed, earnings, recentActivity
router.get('/stats', authMiddleware, providerController.getStats);

module.exports = router;