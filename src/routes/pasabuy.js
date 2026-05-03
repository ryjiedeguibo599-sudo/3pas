const express = require('express')
const router  = express.Router()
const auth    = require('../middleware/auth')
const pasabuyController = require('../controllers/pasabuyController')

router.post('/orders', auth, pasabuyController.createOrder)
router.get('/orders', auth, pasabuyController.getUserOrders)
router.get('/orders/provider/all', auth, pasabuyController.getAllProviderOrders)
router.get('/orders/:id', auth, pasabuyController.getSingleOrder)
router.patch('/orders/:id/cancel', auth, pasabuyController.cancelOrder)
router.patch('/orders/:id/status', auth, pasabuyController.updateOrderStatus)

module.exports = router