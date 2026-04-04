// 📁 src/routes/auth.js

const express        = require('express')
const router         = express.Router()
const multer         = require('multer')
const path           = require('path')
const fs             = require('fs')
const bcrypt         = require('bcryptjs')
const jwt            = require('jsonwebtoken')
const db             = require('../config/db')
const authMiddleware = require('../middleware/authMiddleware')

// ── MULTER ───────────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads/profiles')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext    = path.extname(file.originalname)
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `profile-${unique}${ext}`)
  },
})
const fileFilter = (req, file, cb) =>
  ['image/jpeg','image/jpg','image/png','image/webp'].includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Images lang ang pwede (jpg, png, webp)'), false)

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } })

// ── HELPERS ──────────────────────────────────────────────────────────────────
const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

const safeUser = (u) => ({
  id:            u.id,
  full_name:     u.full_name,
  email:         u.email         ?? null,
  phone:         u.phone         ?? null,
  barangay:      u.barangay      ?? null,
  role:          u.role,
  service_type:  u.service_type  ?? null,
  profile_image: u.profile_image ?? null,
  created_at:    u.created_at,
})

// ── REGISTER ─────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Body: full_name, email, phone (optional), barangay, password, role, service_type
router.post('/register', upload.single('profile_image'), async (req, res) => {
  try {
    const { full_name, email, phone, barangay, password, role, service_type } = req.body

    // Basic validation
    if (!full_name || !email || !barangay || !password || !role)
      return res.status(400).json({ message: 'Punan ang lahat ng required fields.' })

    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: 'Invalid na format ng email.' })

    // Phone validation — optional pero kung may laman dapat valid
    if (phone && phone.trim() !== '') {
      if (!/^09\d{9}$/.test(phone.trim()))
        return res.status(400).json({ message: 'Invalid na contact number. Format: 09XXXXXXXXX (11 digits)' })
    }

    if (password.length < 8)
      return res.status(400).json({ message: 'Password ay minimum 8 characters.' })

    if (!['resident', 'provider', 'admin'].includes(role))
      return res.status(400).json({ message: 'Invalid na role.' })

    if (role === 'provider' && !['pasabuy', 'pasakay', 'parepair'].includes(service_type))
      return res.status(400).json({ message: 'Pumili ng service type.' })

    // Check duplicate email
    const dupEmail = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()])
    if (dupEmail.rows.length)
      return res.status(409).json({ message: 'Ang email na ito ay nakarehistro na.' })

    // Check duplicate phone (only if may phone)
    if (phone && phone.trim() !== '') {
      const dupPhone = await db.query('SELECT id FROM users WHERE phone = $1', [phone.trim()])
      if (dupPhone.rows.length)
        return res.status(409).json({ message: 'Ang contact number na ito ay nakarehistro na.' })
    }

    const profile_image = req.file ? `/uploads/profiles/${req.file.filename}` : null
    const hashed        = await bcrypt.hash(password, 12)
    const cleanPhone    = (phone && phone.trim() !== '') ? phone.trim() : null

    const result = await db.query(
      `INSERT INTO users (full_name, email, phone, barangay, password, role, service_type, profile_image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        full_name.trim(),
        email.toLowerCase().trim(),
        cleanPhone,
        barangay,
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
})

// ── LOGIN ─────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { login, password }  ← login = email OR phone number
router.post('/login', async (req, res) => {
  try {
    const { login, email, phone, password } = req.body

    // Support tatlong format:
    // 1. { login, password }   ← bagong format (email or phone)
    // 2. { email, password }   ← lumang format
    // 3. { phone, password }   ← phone lang
    const loginValue = login || email || phone

    if (!loginValue || !password)
      return res.status(400).json({ message: 'Ilagay ang email/contact number at password.' })

    // Determine kung email o phone
    const isEmail = loginValue.includes('@')

    let result
    if (isEmail) {
      result = await db.query(
        'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
        [loginValue.trim()]
      )
    } else {
      result = await db.query(
        'SELECT * FROM users WHERE phone = $1',
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
      token:   makeToken(user.id),
      user:    safeUser(user),
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ message: 'Server error sa login.' })
  }
})

// ── GET PROFILE ───────────────────────────────────────────────────────────────
// GET /api/auth/profile  (protected)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id])
    if (!result.rows.length)
      return res.status(404).json({ message: 'User not found.' })
    return res.status(200).json({ user: safeUser(result.rows[0]) })
  } catch (err) {
    console.error('Get profile error:', err)
    return res.status(500).json({ message: 'Server error.' })
  }
})

// ── UPDATE PROFILE ────────────────────────────────────────────────────────────
// PUT /api/auth/profile  (protected)
// Mababago: phone, profile_image
// Hindi mababago: full_name, barangay, email
router.put('/profile', authMiddleware, upload.single('profile_image'), async (req, res) => {
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
})

// ── CHANGE PASSWORD ───────────────────────────────────────────────────────────
// PUT /api/auth/change-password  (protected)
router.put('/change-password', authMiddleware, async (req, res) => {
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
})

module.exports = router