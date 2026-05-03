require('dotenv').config()
const db = require('./src/config/db')

async function testDB() {
  try {
    const res = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    console.log('Tables:', res.rows.map(r => r.table_name))

    const email = 'test@example.com'
    const otp = '123456'
    const expiresAt = Date.now() + 10 * 60 * 1000

    await db.query(
      `INSERT INTO otps (email, otp, expires_at) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (email) DO UPDATE 
       SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at`,
      [email, otp, expiresAt]
    )
    console.log('Insert successful!')
  } catch (error) {
    console.error('DB Error:', error.message)
  } finally {
    process.exit(0)
  }
}

testDB()
