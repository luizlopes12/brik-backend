const express = require('express')
const authController = require('../Controllers/authController.js')
const router = express.Router()

router
.get('/users/list', authController.listAllUsers)
.patch('/users/update', authController.updateUser)
.post('/login', authController.userLogin)
.post('/register', authController.userRegistration)


module.exports = router