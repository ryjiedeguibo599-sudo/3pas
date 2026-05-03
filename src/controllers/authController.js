const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../config/db')
const { sendOTP } = require('../config/mailer')

// ── HELPERS ──────────────────────────────────────────────────────────────────
const makeToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' })

const safeUser = (u) => ({
  id:            u.id,
  full_name:     u.full_name,
  email:         u.email         ?? null,
  phone:         u.phone         ?? null,
  barangay:      u.barangay      ?? null,
  role:          u.role,
  service_type:  u.service_type  ?? null,
  profile_image: u.profile_image ?? null,
  is_online:     u.is_online     ?? false,
  created_at:    u.created_at,
})

// ── CONTROLLERS ──────────────────────────────────────────────────────────────

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return res.status(400).json({ message: 'Invalid na email address.' })

    const dup = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()])
    if (dup.rows.length)
      return res.status(409).json({ message: 'Ang email na ito ay nakarehistro na.' })

    const otp       = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

    await db.query(
      `INSERT INTO otps (email, otp, expires_at) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (email) DO UPDATE 
       SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at`,
      [email.toLowerCase().trim(), otp, expiresAt]
    )

    await sendOTP(email.trim(), otp)

    return res.status(200).json({ message: 'Na-send na ang OTP sa iyong email.' })
  } catch (err) {
    console.error('Send OTP error:', err)
    return res.status(500).json({ message: 'Hindi ma-send ang OTP. Subukan muli.' })
  }
}

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp)
      return res.status(400).json({ message: 'Kulang ang data.' })

    const key = email.toLowerCase().trim()
    const result = await db.query('SELECT * FROM otps WHERE email = $1', [key])

    if (!result.rows.length)
      return res.status(400).json({ message: 'Walang OTP para sa email na ito. Mag-request muli.' })

    const record = result.rows[0]

    if (Date.now() > parseInt(record.expires_at, 10)) {
      await db.query('DELETE FROM otps WHERE email = $1', [key])
      return res.status(400).json({ message: 'Expired na ang OTP. Mag-request ng bago.' })
    }

    if (record.otp !== otp.trim())
      return res.status(400).json({ message: 'Mali ang OTP. Subukan muli.' })

    await db.query('DELETE FROM otps WHERE email = $1', [key])

    return res.status(200).json({ message: 'Na-verify na ang email!' })
  } catch (err) {
    console.error('Verify OTP error:', err)
    return res.status(500).json({ message: 'Server error.' })
  }
}

exports.register = async (req, res) => {
  try {
    const { full_name, email, phone, barangay, password, role, service_type, secret_code } = req.body

    if (!full_name || !email || !password || !role)
      return res.status(400).json({ message: 'Punan ang lahat ng required fields.' })

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: 'Invalid na format ng email.' })

    if (phone && phone.trim() !== '') {
      if (!/^09\d{9}$/.test(phone.trim()))
        return res.status(400).json({ message: 'Invalid na contact number. Format: 09XXXXXXXXX (11 digits)' })
    }

    if (password.length < 8)
      return res.status(400).json({ message: 'Password ay minimum 8 characters.' })

    if (!['resident', 'provider', 'admin'].includes(role))
      return res.status(400).json({ message: 'Invalid na role.' })

    if (role === 'admin') {
      if (!secret_code || secret_code !== process.env.ADMIN_SECRET_CODE) {
        return res.status(403).json({ message: 'Invalid admin secret code.' })
      }
    }

    if (role === 'provider' && service_type && !['pasabuy', 'pasakay', 'parepair'].includes(service_type))
      return res.status(400).json({ message: 'Pumili ng service type.' })

    const dupEmail = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()])
    if (dupEmail.rows.length)
      return res.status(409).json({ message: 'Ang email na ito ay nakarehistro na.' })

    if (phone && phone.trim() !== '') {
      const dupPhone = await db.query('SELECT id FROM users WHERE phone = $1', [phone.trim()])
      if (dupPhone.rows.length)
        return res.status(409).json({ message: 'Ang contact number na ito ay nakarehistro na.' })
    }

    const profile_image = req.file ? `/uploads/profiles/${req.file.filename}` : null
    const hashed        = await bcrypt.hash(password, 12)
    const cleanPhone    = (phone && phone.trim() !== '') ? phone.trim() : null
    const cleanBarangay = (barangay && barangay.trim() !== '') ? barangay.trim() : null

    const result = await db.query(
      `INSERT INTO users (full_name, email, phone, barangay, password, role, service_type, profile_image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        full_name.trim(),
        email.toLowerCase().trim(),
        cleanPhone,
        cleanBarangay,
        hashed,
        role,
        role === 'provider' ? (service_type ?? null) : null,
        profile_image,
      ]
    )

    return res.status(201).json({
      message: 'Matagumpay na nairehistro!',
      user_id: result.rows[0].id,
    })
  } catch (err) {
    console.error('Register error:', err)
    if (err.code === '23505') {
      if (err.constraint?.includes('email'))
        return res.status(409).json({ message: 'Ang email na ito ay nakarehistro na.' })
      if (err.constraint?.includes('phone'))
        return res.status(409).json({ message: 'Ang contact number na ito ay nakarehistro na.' })
      return res.status(409).json({ message: 'Ang account na ito ay nakarehistro na.' })
    }
    return res.status(500).json({ message: 'Server error sa registration.' })
  }
}

exports.login = async (req, res) => {
  try {
    const { login, email, phone, password } = req.body

    const loginValue = login || email || phone

    if (!loginValue || !password)
      return res.status(400).json({ message: 'Ilagay ang email/contact number at password.' })

    const isEmail = loginValue.includes('@')

    let result
    if (isEmail) {
      result = await db.query(
        'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
        [loginValue.trim()]
      )
    } else {
      result = await db.query(
        'SELECT * FROM users WHERE phone = $1 OR LOWER(full_name) = LOWER($1)',
        [loginValue.trim()]
      )
    }

    if (!result.rows.length)
      return res.status(401).json({ message: 'Mali ang email/contact number o password.' })

    const user    = result.rows[0]
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch)
      return res.status(401).json({ message: 'Mali ang email/contact number o password.' })

    return res.status(200).json({
      message: 'Login successful.',
      token:   makeToken(user.id, user.role),
      user:    safeUser(user),
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ message: 'Server error sa login.' })
  }
}

exports.getProfile = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id])
    if (!result.rows.length)
      return res.status(404).json({ message: 'User not found.' })
    return res.status(200).json({ user: safeUser(result.rows[0]) })
  } catch (err) {
    console.error('Get profile error:', err)
    return res.status(500).json({ message: 'Server error.' })
  }
}

exports.updateProfile = async (req, res) => {
  try {
    const { phone } = req.body

    if (phone && phone.trim() !== '') {
      if (!/^09\d{9}$/.test(phone.trim()))
        return res.status(400).json({ message: 'Invalid na contact number. Format: 09XXXXXXXXX' })

      const dup = await db.query(
        'SELECT id FROM users WHERE phone = $1 AND id != $2',
        [phone.trim(), req.user.id]
      )
      if (dup.rows.length)
        return res.status(409).json({ message: 'Ginagamit na ang contact number na ito.' })
    }

    const fields = [], values = []
    let idx = 1

    if (phone !== undefined) {
      fields.push(`phone = $${idx++}`)
      values.push((phone && phone.trim() !== '') ? phone.trim() : null)
    }
    if (req.file) {
      fields.push(`profile_image = $${idx++}`)
      values.push(`/uploads/profiles/${req.file.filename}`)
    }

    if (!fields.length)
      return res.status(400).json({ message: 'Walang pagbabago.' })

    values.push(req.user.id)
    const result = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    )

    return res.status(200).json({
      message: 'Na-update na ang profile.',
      user:    safeUser(result.rows[0]),
    })
  } catch (err) {
    console.error('Update profile error:', err)
    if (err.code === '23505')
      return res.status(409).json({ message: 'Ginagamit na ang contact number na ito.' })
    return res.status(500).json({ message: 'Server error.' })
  }
}

exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body

    if (!current_password || !new_password)
      return res.status(400).json({ message: 'Punan ang lahat ng fields.' })
    if (new_password.length < 8)
      return res.status(400).json({ message: 'Bagong password ay minimum 8 characters.' })

    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id])
    if (!result.rows.length)
      return res.status(404).json({ message: 'User not found.' })

    const user    = result.rows[0]
    const isMatch = await bcrypt.compare(current_password, user.password)
    if (!isMatch)
      return res.status(401).json({ message: 'Mali ang kasalukuyang password.' })

    const isSame = await bcrypt.compare(new_password, user.password)
    if (isSame)
      return res.status(400).json({ message: 'Ang bago ay hindi dapat kapareho ng luma.' })

    const hashed = await bcrypt.hash(new_password, 12)
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id])

    return res.status(200).json({ message: 'Napalitan na ang password.' })
  } catch (err) {
    console.error('Change password error:', err)
    return res.status(500).json({ message: 'Server error.' })
  }
}

exports.updateServiceType = async (req, res) => {
  try {
    const { service_type } = req.body
    if (!['pasabuy', 'pasakay', 'parepair'].includes(service_type))
      return res.status(400).json({ message: 'Invalid na service type.' })

    await db.query('UPDATE users SET service_type = $1 WHERE id = $2', [service_type, req.user.id])
    return res.status(200).json({ message: 'Na-update na ang service type.' })
  } catch (err) {
    console.error('Update service type error:', err)
    return res.status(500).json({ message: 'Server error.' })
  }
}

exports.setOnlineStatus = async (req, res) => {
  try {
    const { is_online } = req.body
    if (typeof is_online !== 'boolean')
      return res.status(400).json({ message: 'is_online must be a boolean.' })

    const result = await db.query(
      'UPDATE users SET is_online = $1 WHERE id = $2 RETURNING id, is_online',
      [is_online, req.user.id]
    )
    return res.status(200).json({
      message: is_online ? 'You are now online.' : 'You are now offline.',
      user: result.rows[0],
    })
  } catch (err) {
    console.error('Set online status error:', err)
    return res.status(500).json({ message: 'Server error.' })
  }
}

exports.savePushToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token required' });
    
    await db.query('UPDATE users SET expo_push_token = $1 WHERE id = $2', [token, req.user.id]);
    res.status(200).json({ message: 'Push token saved successfully' });
  } catch (err) {
    console.error('Save push token error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
