const express = require('express')
const notificationsController = require('../Controllers/notificationsController.js')

const router = express.Router()
const jwtAuth = require('../middlewares/jwtAuth.js')
// Remind: add jwt auth in all of these routes

router
.get('/notifications/list', jwtAuth, notificationsController.listAllNotifications)
.post('/notifications/create', notificationsController.createNotification)
.put('/notifications/:id/visualize', notificationsController.visualizeNotification)

module.exports = router