// 📁 src/config/db.js
// PALITAN ang luma mong db.js — para sa PostgreSQL

const { Pool } = require('pg')

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || '3ps_db',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASS     || '',
  // Para sa production (optional):
  // ssl: { rejectUnauthorized: false }
})

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL connection error:', err.message)
  } else {
    console.log('✅ PostgreSQL connected: 3ps_db')
    release()
  }
})

// Helper: para consistent ang query syntax sa buong app
// Paggamit: const { rows } = await db.query('SELECT ...', [params])
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
}