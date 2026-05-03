const pool = require('../config/db')

exports.getMessages = async (req, res) => {
  try {
    const { service_type, service_id } = req.query
    const user_id = req.user.id

    if (!service_type || !service_id) {
      return res.status(400).json({ message: 'Missing service_type or service_id' })
    }

    const messages = await pool.query(
      `SELECT * FROM chat_messages 
       WHERE service_type = $1 AND service_id = $2
       ORDER BY created_at ASC`,
      [service_type, service_id]
    )

    res.json({ messages: messages.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}
