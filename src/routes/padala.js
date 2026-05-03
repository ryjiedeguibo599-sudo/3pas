const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const padalaController = require('../controllers/padalaController')

router.post('/requests', auth, padalaController.createRequest)
router.get('/requests', auth, padalaController.getUserRequests)
router.get('/requests/provider/all', auth, padalaController.getProviderRequests)
router.patch('/requests/:id/cancel', auth, padalaController.cancelRequest)
router.patch('/requests/:id/status', auth, padalaController.updateRequestStatus)

module.exports = router