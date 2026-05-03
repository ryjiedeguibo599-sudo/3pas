// 📁 src/routes/auth.js

const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const authMiddleware = require('../middleware/authMiddleware')
const authController = require('../controllers/authController')

// ── MULTER CONFIG ────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads/profiles')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `profile-${unique}${ext}`)
  },
})
const fileFilter = (req, file, cb) =>
  ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Images lang ang pwede (jpg, png, webp)'), false)

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } })

// ── ROUTES ───────────────────────────────────────────────────────────────────

// Public
router.post('/send-otp', authController.sendOtp)
router.post('/verify-otp', authController.verifyOtp)
router.post('/register', upload.single('profile_image'), authController.register)
router.post('/login', authController.login)

// Protected
router.post('/save-push-token', authMiddleware, authController.savePushToken)
router.get('/profile', authMiddleware, authController.getProfile)
router.put('/profile', authMiddleware, upload.single('profile_image'), authController.updateProfile)
router.put('/change-password', authMiddleware, authController.changePassword)
router.patch('/update-service-type', authMiddleware, authController.updateServiceType)
router.patch('/online-status',       authMiddleware, authController.setOnlineStatus)

module.exports = router