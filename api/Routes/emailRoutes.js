
const express = require('express')
const emailController = require('../Controllers/emailController.js')
const router = express.Router()

// Remind: add jwt auth in all of these routes

router
.post('/email/home', emailController.sendContactemail)
.post('/email/landing', emailController.sendContactemailFromLandingPage)
.post('/email/visit', emailController.sendVisitEmail)

module.exports = router