const Banner = require('../Models/Banner.js')
require('dotenv').config()

// to do: Create, delete, update and list banners
class bannerController {
    static listBanners = async (req, res) =>{
        let bannersList = await Banner.findAll({})
        if(bannersList){
            res.status(200).json(bannersList)
        }else{
            res.status(500).json({message: 'Erro no servidor'})
        }
    }
    static listBannerById = async (req, res) =>{
        let bannersList = await Banner.findByPk(req.params.id)
        if(bannersList){
            res.status(200).json(bannersList)
        }else{
            res.status(500).json({message: 'Erro no servidor'})
        }
    }
    static createBanner = async (req, res) =>{
        let { name, link, imageUrl, initDate, expireDate } = req.body
        let newBanner = await Banner.create({
            name,
            link,
            imageUrl,
            initDate, 
            expireDate
        })
        if(newBanner){
            res.status(200).json({message: 'Novo banner criado', newBanner})
        }else{
            res.status(500).json({message: 'Erro no servidor'})
        }
    }
    static updateBanner = async (req, res) =>{
        let { name, link, imageUrl, initDate, expireDate } = req.body
        let banner = await Banner.update({
            name,
            link,
            imageUrl,
            initDate, 
            expireDate
        }, {where: {id: req.params.id}})
        if(banner){
        let bannersUpdated = await Banner.findByPk(req.params.id)
            res.status(200).json({message: 'Banner atualizado',bannersUpdated})
        }else{
            res.status(500).json({message: 'Erro no servidor'})
        }
    }
    static deleteBanner = async (req, res) =>{
        let banner = await Banner.destroy({where: {id: req.params.id}})
        if(banner){
            res.status(200).json({message: 'Banner excluido com sucesso.'})
        }else{
            res.status(500).json({message: 'Erro no servidor'})
        }
    }
}

module.exports = bannerController