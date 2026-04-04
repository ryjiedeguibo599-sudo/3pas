// src/routes/provider.js

const express        = require('express')
const router         = express.Router()
const db             = require('../config/db')
const authMiddleware = require('../middleware/auth') // ✅ CORRECT — same as pasabuy, pasakay

// ── PATCH /api/provider/status ────────────────────────────────
// Updates provider online/offline status
// Body: { online: true | false }
router.patch('/status', authMiddleware, async (req, res) => {
  try {
    const providerId = req.user.id
    const { online }  = req.body

    if (typeof online !== 'boolean') {
      return res.status(400).json({ message: 'online field is required (boolean)' })
    }

    // ── Option A: kung may `providers` table kang may `is_online` column ──
    // I-uncomment kung meron:
    /*
    await db.query(
      'UPDATE providers SET is_online = ?, updated_at = NOW() WHERE user_id = ?',
      [online ? 1 : 0, providerId]
    )
    */

    // ── Option B: kung sa `users` table naka-store ang is_online ──
    // I-uncomment kung meron:
    /*
    await db.query(
      'UPDATE users SET is_online = ?, updated_at = NOW() WHERE id = ?',
      [online ? 1 : 0, providerId]
    )
    */

    // ── Option C: Walang DB column pa (default, works agad) ──
    // Ang frontend mismo ang mag-save via AsyncStorage.
    // Palitan ng Option A o B kapag naidagdag mo na ang DB column.
    return res.json({
      success: true,
      online,
      message: online ? 'You are now online.' : 'You are now offline.',
    })

  } catch (err) {
    console.error('PATCH /provider/status error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// ── GET /api/provider/stats ───────────────────────────────────
// Returns pending, completed, earnings, recentActivity
// Query: ?type=pasabuy | pasakay | parepair
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const providerId  = req.user.id
    const serviceType = req.query.type

    let pending        = 0
    let completed      = 0
    let earnings       = 0
    let recentActivity = []

    // ── PasaBUY ───────────────────────────────────────────────
    if (!serviceType || serviceType === 'pasabuy') {
      const [[pendingRow]] = await db.query(
        `SELECT COUNT(*) as count FROM pasabuy_orders
         WHERE provider_id = ? AND status = 'pending'`,
        [providerId]
      ).catch(() => [[{ count: 0 }]])

      const [[completedRow]] = await db.query(
        `SELECT COUNT(*) as count FROM pasabuy_orders
         WHERE provider_id = ? AND status = 'completed'
         AND DATE(updated_at) = CURDATE()`,
        [providerId]
      ).catch(() => [[{ count: 0 }]])

      const [[earningsRow]] = await db.query(
        `SELECT COALESCE(SUM(total_amount), 0) as total FROM pasabuy_orders
         WHERE provider_id = ? AND status = 'completed'
         AND DATE(updated_at) = CURDATE()`,
        [providerId]
      ).catch(() => [[{ total: 0 }]])

      pending   = pendingRow?.count  || 0
      completed = completedRow?.count || 0
      earnings  = earningsRow?.total  || 0

      const [recentRows] = await db.query(
        `SELECT o.id, o.status, o.total_amount, o.created_at,
                u.full_name as customer_name
         FROM pasabuy_orders o
         LEFT JOIN users u ON o.user_id = u.id
         WHERE o.provider_id = ?
         ORDER BY o.created_at DESC LIMIT 5`,
        [providerId]
      ).catch(() => [[]])

      recentActivity = (recentRows || []).map(row => ({
        icon:   row.status === 'completed' ? '✅' : row.status === 'pending' ? '📋' : '🔄',
        title:  row.status === 'completed' ? 'Order completed' : 'New order received',
        desc:   `${row.customer_name || 'Customer'} · ₱${row.total_amount || 0}`,
        time:   timeAgo(row.created_at),
        status: capitalize(row.status),
      }))
    }

    // ── Pasakay ───────────────────────────────────────────────
    if (!serviceType || serviceType === 'pasakay') {
      const [[pendingRow]] = await db.query(
        `SELECT COUNT(*) as count FROM pasakay_rides
         WHERE provider_id = ? AND status = 'pending'`,
        [providerId]
      ).catch(() => [[{ count: 0 }]])

      const [[completedRow]] = await db.query(
        `SELECT COUNT(*) as count FROM pasakay_rides
         WHERE provider_id = ? AND status = 'completed'
         AND DATE(updated_at) = CURDATE()`,
        [providerId]
      ).catch(() => [[{ count: 0 }]])

      const [[earningsRow]] = await db.query(
        `SELECT COALESCE(SUM(fare), 0) as total FROM pasakay_rides
         WHERE provider_id = ? AND status = 'completed'
         AND DATE(updated_at) = CURDATE()`,
        [providerId]
      ).catch(() => [[{ total: 0 }]])

      if (!serviceType) {
        pending   += pendingRow?.count  || 0
        completed += completedRow?.count || 0
        earnings  += earningsRow?.total  || 0
      } else {
        pending   = pendingRow?.count  || 0
        completed = completedRow?.count || 0
        earnings  = earningsRow?.total  || 0

        const [recentRows] = await db.query(
          `SELECT r.id, r.status, r.fare, r.created_at,
                  u.full_name as customer_name
           FROM pasakay_rides r
           LEFT JOIN users u ON r.user_id = u.id
           WHERE r.provider_id = ?
           ORDER BY r.created_at DESC LIMIT 5`,
          [providerId]
        ).catch(() => [[]])

        recentActivity = (recentRows || []).map(row => ({
          icon:   row.status === 'completed' ? '✅' : '🛵',
          title:  row.status === 'completed' ? 'Ride completed' : 'New booking received',
          desc:   `${row.customer_name || 'Customer'} · ₱${row.fare || 0}`,
          time:   timeAgo(row.created_at),
          status: capitalize(row.status),
        }))
      }
    }

    // ── PaRepair ──────────────────────────────────────────────
    if (!serviceType || serviceType === 'parepair') {
      const [[pendingRow]] = await db.query(
        `SELECT COUNT(*) as count FROM parepair_requests
         WHERE provider_id = ? AND status = 'pending'`,
        [providerId]
      ).catch(() => [[{ count: 0 }]])

      const [[completedRow]] = await db.query(
        `SELECT COUNT(*) as count FROM parepair_requests
         WHERE provider_id = ? AND status = 'completed'
         AND DATE(updated_at) = CURDATE()`,
        [providerId]
      ).catch(() => [[{ count: 0 }]])

      if (!serviceType) {
        pending   += pendingRow?.count  || 0
        completed += completedRow?.count || 0
      } else {
        pending   = pendingRow?.count  || 0
        completed = completedRow?.count || 0

        const [recentRows] = await db.query(
          `SELECT r.id, r.status, r.created_at,
                  u.full_name as customer_name
           FROM parepair_requests r
           LEFT JOIN users u ON r.user_id = u.id
           WHERE r.provider_id = ?
           ORDER BY r.created_at DESC LIMIT 5`,
          [providerId]
        ).catch(() => [[]])

        recentActivity = (recentRows || []).map(row => ({
          icon:   row.status === 'completed' ? '✅' : '🔧',
          title:  row.status === 'completed' ? 'Repair completed' : 'New repair request',
          desc:   `${row.customer_name || 'Customer'}`,
          time:   timeAgo(row.created_at),
          status: capitalize(row.status),
        }))
      }
    }

    return res.json({
      success:      true,
      pending,
      completed,
      earnings,
      earningsDiff: 0,
      recentActivity,
    })

  } catch (err) {
    console.error('GET /provider/stats error:', err)
    // ✅ Never crash — return zeros so frontend still works
    return res.json({
      success:       false,
      pending:       0,
      completed:     0,
      earnings:      0,
      earningsDiff:  0,
      recentActivity: [],
    })
  }
})

// ── Helpers ───────────────────────────────────────────────────
function timeAgo(date) {
  if (!date) return ''
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

module.exports = router