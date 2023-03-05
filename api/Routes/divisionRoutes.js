
const express = require('express')
const divisionsController = require('../Controllers/divisionsController.js')
const router = express.Router()
const jwtAuth = require('../middlewares/jwtAuth.js')
const divisionPartnersController = require('../Controllers/divisionPartnersController.js')
// Remind: add jwt auth in all of these routes

router
.get('/divisions/list', divisionsController.listDivisionsAndTheirLots)
.get('/divisions/list/:id', divisionsController.listDivisionById)
.post('/divisions/add', divisionsController.addNewDivision)
.patch('/divisions/edit/:id', divisionsController.editExistingDivision)
.delete('/divisions/delete/:id', divisionsController.deleteDivision)
.post('/divisions/:id/partners/add', divisionPartnersController.addPartner)
.patch('/divisions/partners/edit/:id', divisionPartnersController.updatePartner)
.delete('/divisions/partners/delete/:id', divisionPartnersController.deletePartner)

module.exports = router