const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const pasakayController = require('../controllers/pasakayController')

// ✅ SPECIFIC ROUTES MUNA — bago ang :id routes
router.get('/rides/available/all', auth, pasakayController.getAvailableRides)
router.post('/book', auth, pasakayController.bookRide)
router.get('/rides', auth, pasakayController.getUserRides)

// ✅ DYNAMIC :id ROUTES — HULI PALAGI
router.patch('/rides/:id/cancel', auth, pasakayController.cancelRide)
router.patch('/rides/:id/status', auth, pasakayController.updateRideStatus)
router.post('/rides/:id/location', auth, pasakayController.updateLiveLocation)

module.exports = router