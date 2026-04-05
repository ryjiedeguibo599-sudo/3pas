const { Pool } = require('pg')

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || '3ps_db',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASS     || '',
  ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' 
    ? { rejectUnauthorized: false } 
    : false
})

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL connection error:', err.message)
  } else {
    console.log('✅ PostgreSQL connected: 3ps_db')
    release()
  }
})

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
}