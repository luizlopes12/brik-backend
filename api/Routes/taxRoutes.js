
const express = require('express')
const taxController = require('../Controllers/taxController.js')

const router = express.Router()
const jwtAuth = require('../middlewares/jwtAuth.js')
// Remind: add jwt auth in all of these routes

router
.get('/taxes/list', taxController.listAllTaxesValues)
.patch('/taxes/edit', taxController.updateTaxValues)

module.exports = router