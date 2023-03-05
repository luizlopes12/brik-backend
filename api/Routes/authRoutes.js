const express = require('express')
const authController = require('../Controllers/authController.js')
const router = express.Router()

router
.post('/login', authController.userLogin)
.post('/register', authController.userRegistration)

module.exports = router