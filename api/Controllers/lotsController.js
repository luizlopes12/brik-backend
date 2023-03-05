const User = require('../Models/User.js')
const Division = require('../Models/Division.js')
const Lot = require('../Models/Lot.js')
const LotImage = require('../Models/LotImage.js')
const Partner = require('../Models/Partner.js')

// to do: crud lots, list lots data with their partners, images and data about their division
class lotsController { 
    static addLot = async (req, res) =>{
        // to do: req lot data and add on database, to think about how relate the images and partners data to each lot
        
        let {
            hiddenPrice,
            taxPercentage,
            taxPercentage24,
            maxPortionsQuantity,
            name, 
            lotType, 
            location, 
            metrics, 
            isAvaible,
            basePrice,
            finalPrice,
            description,
            idLoteamento
        } = req.body
        try {
            let newLot = await Lot.create({
                hiddenPrice,
                taxPercentage,
                taxPercentage24,
                maxPortionsQuantity,
                name, 
                lotType, 
                location, 
                metrics, 
                isAvaible,
                basePrice,
                finalPrice,
                description,
                idLoteamento
            })
            res.status(200).json({message: 'Lote criado com sucessso.', newLot})
        } catch (error) {
            res.status(403).json({message: 'Não foi possível adicionar o lote.', error})
        }
    }
    static listLots = async (req, res) =>{
        let list = await Lot.findAll({
            include: [
            {
                model: LotImage,
                as: 'loteImages',
                required: false               
            },
            {
                model: Partner,
                as: 'lotePartners',
                required: false 
            }
        ]
        })
        if(list){
            res.status(200).json(list)
        }else{
            res.status(500).json({message: 'Erro no servidor.'})
        }
    }
    static listLotById = async (req, res) =>{
        let { id } = req.params
        let list = await Lot.findAll({where: {id},
            include: [
            {
                model: LotImage,
                as: 'loteImages',
                required: false               
            },
            {
                model: Partner,
                as: 'lotePartners',
                required: false 
            },
        ]})
        if(list){
            res.status(200).json(list)
        }else{
            res.status(500).json({message: 'Erro no servidor.'})
        }
    }
    static updateLot = async (req, res) =>{
        let { id } = req.params
        let {
            hiddenPrice,
            taxPercentage,
            taxPercentage24,
            maxPortionsQuantity,
            name, 
            lotType, 
            location, 
            metrics, 
            isAvaible,
            basePrice,
            finalPrice,
            description,
            idLoteamento
        } = req.body
        let updateLot = await Lot.update({
            hiddenPrice,
            taxPercentage,
            taxPercentage24,
            maxPortionsQuantity,
            name, 
            lotType, 
            location, 
            metrics, 
            isAvaible,
            basePrice,
            finalPrice,
            description,
            idLoteamento
        },
        {
            where: { id }
        }
        )
        if(updateLot){
            let updatedLot = await Lot.findByPk(id)
            res.status(200).json({message: 'Lote atualizado com sucesso', data: updatedLot})
        }else{
            res.status(200).json({message: 'Erro ao atualizar o lote'})
        }
    }
    static deleteLot = async (req, res) =>{
        let { id } = req.params
        let list = await Lot.destroy({where: {id}})
        if(list){
            let newList = await Lot.findAll({})
            res.status(200).json({message: 'Lote excluido com sucesso', newList})
        }else{
            res.status(500).json({message: 'Erro no servidor.'})
        }
    }
}

module.exports = lotsController