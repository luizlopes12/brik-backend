const express = require('express')
const router = express.Router()
const bannerController = require('../Controllers/bannerController')

router
.get('/banners/list', bannerController.listBanners)
.get('/banners/:id', bannerController.listBannerById)
.post('/banners/add', bannerController.createBanner)
.patch('/banners/edit/:id', bannerController.updateBanner)
.delete('/banners/delete/:id', bannerController.deleteBanner)

module.exports = router