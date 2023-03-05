const LotImage = require('../Models/LotImage.js')
require('dotenv').config()

class lotImagesController { 
    static addImage = async (req, res) =>{
            let { url } = req.body
            let { id } = req.params
            if(!url){
                res.status(403).json({message: 'Imagem não enviada'})
            }else{
                 try {
                    await LotImage.create({
                    imageUrl: url,
                    idLote: id
                })
                let newImages = await LotImage.findAll({
                    where:{
                        idLote: id
                    }
                })
                res.status(200).json({message: 'Imagem adicionada com sucesso',newImages})
                } catch (error) {
                    res.status(403).json({message: 'Erro ao inserir imagem, tente novamente'})
                }
            }
    }
    static deleteImage = async (req, res) =>{
            let { id } = req.params
            let imageSelected = await LotImage.destroy({where: {id}})
            if(imageSelected){
                let newImages = await LotImage.findAll({
                    where:{
                        idLote: id
                    }
                })
                res.status(200).json({message: 'Imagem excluída com sucesso.', newImages})
            }else{
                res.status(404).json({message: 'Imagem não encontrada'})
            }
    }
}

module.exports = lotImagesController