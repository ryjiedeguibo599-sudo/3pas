const db = require('../config/db');

// ── Helpers ───────────────────────────────────────────────────
function timeAgo(date) {
  if (!date) return '';
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

exports.updateStatus = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { online }  = req.body;

    if (typeof online !== 'boolean') {
      return res.status(400).json({ message: 'online field is required (boolean)' });
    }

    return res.json({
      success: true,
      online,
      message: online ? 'You are now online.' : 'You are now offline.',
    });

  } catch (err) {
    console.error('PATCH /provider/status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const providerId  = req.user.id;
    const serviceType = req.query.type;

    let pending        = 0;
    let completed      = 0;
    let earnings       = 0;
    let recentActivity = [];

    // Helper for safe query wrapper for PG
    const querySafe = async (text, params) => {
      try {
        const result = await db.query(text, params);
        return result.rows;
      } catch (err) {
        console.error("Query Error: ", err);
        return [];
      }
    };

    // ── PasaBUY ───────────────────────────────────────────────
    if (!serviceType || serviceType === 'pasabuy') {
      const pendingRows = await querySafe(
        `SELECT COUNT(*) as count FROM pasabuy_orders
         WHERE provider_id = $1 AND status = 'pending'`,
        [providerId]
      );

      const completedRows = await querySafe(
        `SELECT COUNT(*) as count FROM pasabuy_orders
         WHERE provider_id = $1 AND status = 'completed'
         AND DATE(updated_at) = CURRENT_DATE`,
        [providerId]
      );

      const earningsRows = await querySafe(
        `SELECT COALESCE(SUM(total_amount), 0) as total FROM pasabuy_orders
         WHERE provider_id = $1 AND status = 'completed'
         AND DATE(updated_at) = CURRENT_DATE`,
        [providerId]
      );

      pending   = parseInt(pendingRows[0]?.count || 0);
      completed = parseInt(completedRows[0]?.count || 0);
      earnings  = parseFloat(earningsRows[0]?.total || 0);

      const recentRows = await querySafe(
        `SELECT o.id, o.status, o.total_amount, o.created_at,
                u.full_name as customer_name
         FROM pasabuy_orders o
         LEFT JOIN users u ON o.user_id = u.id
         WHERE o.provider_id = $1
         ORDER BY o.created_at DESC LIMIT 5`,
        [providerId]
      );

      recentActivity = recentRows.map(row => ({
        icon:   row.status === 'completed' ? '✅' : row.status === 'pending' ? '📋' : '🔄',
        title:  row.status === 'completed' ? 'Order completed' : 'New order received',
        desc:   `${row.customer_name || 'Customer'} · ₱${row.total_amount || 0}`,
        time:   timeAgo(row.created_at),
        status: capitalize(row.status),
      }));
    }

    // ── Pasakay ───────────────────────────────────────────────
    if (!serviceType || serviceType === 'pasakay') {
      const pendingRows = await querySafe(
        `SELECT COUNT(*) as count FROM pasakay_rides
         WHERE provider_id = $1 AND status = 'pending'`,
        [providerId]
      );

      const completedRows = await querySafe(
        `SELECT COUNT(*) as count FROM pasakay_rides
         WHERE provider_id = $1 AND status = 'completed'
         AND DATE(updated_at) = CURRENT_DATE`,
        [providerId]
      );

      const earningsRows = await querySafe(
        `SELECT COALESCE(SUM(fare), 0) as total FROM pasakay_rides
         WHERE provider_id = $1 AND status = 'completed'
         AND DATE(updated_at) = CURRENT_DATE`,
        [providerId]
      );

      if (!serviceType) {
        pending   += parseInt(pendingRows[0]?.count || 0);
        completed += parseInt(completedRows[0]?.count || 0);
        earnings  += parseFloat(earningsRows[0]?.total || 0);
      } else {
        pending   = parseInt(pendingRows[0]?.count || 0);
        completed = parseInt(completedRows[0]?.count || 0);
        earnings  = parseFloat(earningsRows[0]?.total || 0);

        const recentRows = await querySafe(
          `SELECT r.id, r.status, r.fare, r.created_at,
                  u.full_name as customer_name
           FROM pasakay_rides r
           LEFT JOIN users u ON r.user_id = u.id
           WHERE r.provider_id = $1
           ORDER BY r.created_at DESC LIMIT 5`,
          [providerId]
        );

        recentActivity = recentRows.map(row => ({
          icon:   row.status === 'completed' ? '✅' : '🛵',
          title:  row.status === 'completed' ? 'Ride completed' : 'New booking received',
          desc:   `${row.customer_name || 'Customer'} · ₱${row.fare || 0}`,
          time:   timeAgo(row.created_at),
          status: capitalize(row.status),
        }));
      }
    }

    // ── PaRepair ──────────────────────────────────────────────
    if (!serviceType || serviceType === 'parepair') {
      const pendingRows = await querySafe(
        `SELECT COUNT(*) as count FROM parepair_requests
         WHERE provider_id = $1 AND status = 'pending'`,
        [providerId]
      );

      const completedRows = await querySafe(
        `SELECT COUNT(*) as count FROM parepair_requests
         WHERE provider_id = $1 AND status = 'completed'
         AND DATE(updated_at) = CURRENT_DATE`,
        [providerId]
      );

      if (!serviceType) {
        pending   += parseInt(pendingRows[0]?.count || 0);
        completed += parseInt(completedRows[0]?.count || 0);
      } else {
        pending   = parseInt(pendingRows[0]?.count || 0);
        completed = parseInt(completedRows[0]?.count || 0);

        const recentRows = await querySafe(
          `SELECT r.id, r.status, r.created_at,
                  u.full_name as customer_name
           FROM parepair_requests r
           LEFT JOIN users u ON r.user_id = u.id
           WHERE r.provider_id = $1
           ORDER BY r.created_at DESC LIMIT 5`,
          [providerId]
        );

        recentActivity = recentRows.map(row => ({
          icon:   row.status === 'completed' ? '✅' : '🔧',
          title:  row.status === 'completed' ? 'Repair completed' : 'New repair request',
          desc:   `${row.customer_name || 'Customer'}`,
          time:   timeAgo(row.created_at),
          status: capitalize(row.status),
        }));
      }
    }

    return res.json({
      success:      true,
      pending,
      completed,
      earnings,
      earningsDiff: 0,
      recentActivity,
    });

  } catch (err) {
    console.error('GET /provider/stats error:', err);
    return res.json({
      success:       false,
      pending:       0,
      completed:     0,
      earnings:      0,
      earningsDiff:  0,
      recentActivity: [],
    });
  }
};
