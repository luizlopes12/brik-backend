
const express = require('express')
const salesController = require('../Controllers/salesController.js')

const router = express.Router()
const jwtAuth = require('../middlewares/jwtAuth.js')
// Remind: add jwt auth in all of these routes

router
.get('/sales/list', salesController.listAllSales)
.get('/sales/list/:id', salesController.listSaleById)
.post('/sales/create', salesController.createSaleAndTheirAnualParcels)
.post('/sales/status/update', salesController.updateSaleStatus)
// .get('/test/cron', salesController.testCron)

module.exports = router