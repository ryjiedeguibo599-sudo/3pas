const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const chatController = require('../controllers/chatController')

router.get('/', auth, chatController.getMessages)

module.exports = router
