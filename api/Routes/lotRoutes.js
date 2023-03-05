
const express = require('express')
const lotImagesController = require('../Controllers/lotImagesController.js')
const lotsController = require('../Controllers/lotsController.js')
const lotPartnersController = require('../Controllers/lotPartnersController.js')

const router = express.Router()
const jwtAuth = require('../middlewares/jwtAuth.js')
// Remind: add jwt auth in all of these routes

router
.get('/lots/list', lotsController.listLots)
.get('/lots/:id', lotsController.listLotById)
.post('/lots/add', lotsController.addLot)
.patch('/lots/edit/:id', lotsController.updateLot)
.delete('/lots/delete/:id', lotsController.deleteLot)
.post('/lots/:id/images/add', lotImagesController.addImage)
.delete('/lots/images/delete/:id', lotImagesController.deleteImage)
.post('/lots/:id/partners/add', lotPartnersController.addPartner)
.patch('/lots/partners/edit/:id', lotPartnersController.updatePartner)
.delete('/lots/partners/delete/:idLote/:id', lotPartnersController.deletePartner)

module.exports = router