
const Lot = require('../Models/Lot.js')
const Partner = require('../Models/Partner.js')

class lotPartnersController { 
    static addPartner = async (req, res) =>{
        let { name, CPF, percentage } = req.body
        let { id: idLote } = req.params
        // {
        //     name,
        //     CPF,
        //     percentage,
        //     idLote
        // }
        
        let partnerAdded = await Partner.create({
                    name,
                    CPF,
                    percentage,
                    idLote
        })

        if(partnerAdded){
            let partnersList = await Partner.findAll({
                where: { idLote }
            })
            res.status(200).json({message: 'Sócio adicionado com sucesso.', partnersList})
        }else{
            res.status(403).json({message: 'Não foi possível adicionar novo sócio.'})
        }
    }
    static updatePartner = async (req, res) =>{
        let idPartner = parseInt(req.params.id)
        let { name, CPF, percentage } = req.body

        let partnerUpdate= await Partner.update({
            name,
            CPF,
            percentage,
        },
        {
            where: { id: idPartner}
        })
        console.log({Partner: partnerUpdate})
        let partnerUpdated = await Partner.findByPk(idPartner);
        
        if(partnerUpdate){
            res.status(200).json({message: "Sócio atualizado com sucesso.", data: partnerUpdated})
        }else{
            res.status(400).json({message: "Ocorreu um erro ao atualizar o sócio, tente novamente."})
        }
    }
    static deletePartner = async (req, res) =>{
        let { id, idLote } = req.params
        let partnerSelected = await Partner.destroy({where: { id, idLote }})
        if(partnerSelected){
            res.status(200).json({message: 'Sócio excluído com sucesso.'})
        }else{
            res.status(404).json({message: 'Sócio não encontrado'})
        }
    }
}

module.exports = lotPartnersController