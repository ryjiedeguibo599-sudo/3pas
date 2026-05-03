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
    pool.query(`
      CREATE TABLE IF NOT EXISTS otps (
        email VARCHAR(255) PRIMARY KEY,
        otp VARCHAR(6) NOT NULL,
        expires_at BIGINT NOT NULL
      )
    `).catch(err => console.error('❌ Failed to create otps table:', err))
    pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS expo_push_token VARCHAR(255)
    `).catch(err => console.error('❌ Failed to add expo_push_token column:', err))
    pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false
    `).catch(err => console.error('❌ Failed to add is_online column:', err))
    pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        sender_id INT REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
        service_type VARCHAR(50) NOT NULL,
        service_id INT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(err => console.error('❌ Failed to create chat_messages table:', err))
    release()
  }
})  

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
}