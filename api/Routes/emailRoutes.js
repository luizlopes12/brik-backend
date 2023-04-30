
const express = require('express')
const emailController = require('../Controllers/emailController.js')
const router = express.Router()

// Remind: add jwt auth in all of these routes

router
.post('/email/home', emailController.sendContactemail)
.post('/email/landing', emailController.sendContactemail)


module.exports = router