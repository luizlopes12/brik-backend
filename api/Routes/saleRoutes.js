
const express = require('express')
const salesController = require('../Controllers/salesController.js')

const router = express.Router()
const jwtAuth = require('../middlewares/jwtAuth.js')
// Remind: add jwt auth in all of these routes

router
.get('/sales/list', salesController.listAllSales)
.get('/sales/list/:id', salesController.listSaleById)
.get('/sales/resume', salesController.getChartData)
.post('/sales/create', salesController.createSaleAndTheirAnualParcels)
.post('/sales/status/update', salesController.updateSaleStatus)
.post('/sales/contract/email/send', salesController.sendClickSignEmail)
module.exports = router