const db = require('../config/db');

exports.getUsersStats = async (req, res) => {
  try {
    const result = await db.query("SELECT COUNT(*) FROM users WHERE role IN ('resident', 'user')");
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProvidersStats = async (req, res) => {
  try {
    const result = await db.query("SELECT COUNT(*) FROM users WHERE role = 'provider'");
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOrdersStats = async (req, res) => {
  try {
    const result = await db.query('SELECT COUNT(*) FROM grocery_orders');
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRidesStats = async (req, res) => {
  try {
    const result = await db.query('SELECT COUNT(*) FROM ride_bookings');
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRepairsStats = async (req, res) => {
  try {
    const result = await db.query('SELECT COUNT(*) FROM repair_requests');
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single user details
exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT id, full_name, email, phone, barangay, role, service_type, profile_image, created_at FROM users WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    // Delete dependent records first to avoid foreign key constraint errors
    await db.query('DELETE FROM chat_messages WHERE sender_id = $1 OR receiver_id = $1', [id]).catch(() => {});
    await db.query('DELETE FROM reviews WHERE user_id = $1 OR provider_id = $1', [id]).catch(() => {});
    
    // For grocery_orders, delete order_items first
    await db.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM grocery_orders WHERE user_id = $1)', [id]).catch(() => {});
    await db.query('DELETE FROM grocery_orders WHERE user_id = $1', [id]).catch(() => {});
    await db.query('DELETE FROM ride_bookings WHERE user_id = $1', [id]).catch(() => {});
    await db.query('DELETE FROM repair_requests WHERE user_id = $1', [id]).catch(() => {});
    await db.query('DELETE FROM payments WHERE user_id = $1', [id]).catch(() => {});
    await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [id]).catch(() => {});
    await db.query('DELETE FROM provider_documents WHERE provider_id IN (SELECT id FROM service_providers WHERE user_id = $1)', [id]).catch(() => {});
    await db.query('DELETE FROM service_providers WHERE user_id = $1', [id]).catch(() => {});
    
    // Finally delete the user
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Failed to delete user:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

exports.getProviders = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT sp.id, u.full_name, u.email, u.phone, sp.service_type, sp.is_available
      FROM service_providers sp
      JOIN users u ON sp.user_id = u.id
      ORDER BY u.full_name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOverallSummary = async (req, res) => {
  try {
    const [users, providers, orders, rides, repairs, reviews] = await Promise.all([
      db.query("SELECT COUNT(*) FROM users WHERE role IN ('resident', 'user')"),
      db.query("SELECT COUNT(*) FROM users WHERE role = 'provider'"),
      db.query('SELECT COUNT(*) FROM grocery_orders'),
      db.query('SELECT COUNT(*) FROM ride_bookings'),
      db.query('SELECT COUNT(*) FROM repair_requests'),
      db.query('SELECT ROUND(AVG(rating), 1) as avg FROM reviews'),
    ]);

    // Online users — optional, won't crash if column missing
    let active_users = 0;
    try {
      const online = await db.query('SELECT COUNT(*) FROM users WHERE is_online = true');
      active_users = parseInt(online.rows[0].count);
    } catch (_) {}

    res.json({
      users:        parseInt(users.rows[0].count),
      providers:    parseInt(providers.rows[0].count),
      orders:       parseInt(orders.rows[0].count),
      rides:        parseInt(rides.rows[0].count),
      repairs:      parseInt(repairs.rows[0].count),
      avg_rating:   parseFloat(reviews.rows[0].avg) || 0,
      active_users,
    });
  } catch (err) {
    console.error('getOverallSummary error:', err);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

exports.getOrdersPerDay = async (req, res) => {
  try {
    const [orders, rides, repairs] = await Promise.all([
      db.query(`
        SELECT DATE(ordered_at) as date, COUNT(*) as count
        FROM grocery_orders
        WHERE ordered_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(ordered_at) ORDER BY date
      `),
      db.query(`
        SELECT DATE(booked_at) as date, COUNT(*) as count
        FROM ride_bookings
        WHERE booked_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(booked_at) ORDER BY date
      `),
      db.query(`
        SELECT DATE(requested_at) as date, COUNT(*) as count
        FROM repair_requests
        WHERE requested_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(requested_at) ORDER BY date
      `),
    ]);
    res.json({
      orders:  orders.rows,
      rides:   rides.rows,
      repairs: repairs.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRatings = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        service_type,
        ROUND(AVG(rating), 1) as avg_rating,
        COUNT(*) as total_reviews
      FROM reviews
      GROUP BY service_type
    `);
    res.json({ ratings: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTopProviders = async (req, res) => {
  try {
    const result = await db.query(`
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
    `);
    res.json({ providers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStatusBreakdown = async (req, res) => {
  try {
    const [orders, rides, repairs] = await Promise.all([
      db.query(`
        SELECT status, COUNT(*) as count 
        FROM grocery_orders GROUP BY status
      `),
      db.query(`
        SELECT status, COUNT(*) as count 
        FROM ride_bookings GROUP BY status
      `),
      db.query(`
        SELECT status, COUNT(*) as count 
        FROM repair_requests GROUP BY status
      `),
    ]);
    res.json({
      orders:  orders.rows,
      rides:   rides.rows,
      repairs: repairs.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
