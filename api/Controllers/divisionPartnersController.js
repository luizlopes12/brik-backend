
const Lot = require('../Models/Lot.js')
const DivisionPartner = require('../Models/DivisionPartner.js')

class divisionPartnersController { 
    static addPartner = async (req, res) =>{
        let { name, CPF, percentage } = req.body
        let { id: idLoteamento } = req.params
        let partnerAdded = await DivisionPartner.create({
            name,
            CPF,
            percentage,
            idLoteamento
        })

        if(partnerAdded){
            let partnersList = await DivisionPartner.findAll({
                where: { idLoteamento }
            })
            res.status(200).json({message: 'Sócio adicionado com sucesso.', partnersList})
        }else{
            res.status(403).json({message: 'Não foi possível adicionar novo sócio.'})
        }
    }
    static updatePartner = async (req, res) =>{
        let idPartner = parseInt(req.params.id)
        let { name, CPF, percentage } = req.body

        let partnerUpdate= await DivisionPartner.update({
            name,
            CPF,
            percentage,
        },
        {
            where: { id: idPartner}
        })

        let partnerUpdated = await DivisionPartner.findByPk(idPartner);

        if(partnerUpdate){
            res.status(200).json({message: "Sócio atualizado com sucesso.", data: partnerUpdated})
        }else{
            res.status(400).json({message: "Ocorreu um erro ao atualizar o sócio, tente novamente."})
        }
    }
    static deletePartner = async (req, res) =>{
        let { id } = req.params
        let partnerSelected = await DivisionPartner.destroy({where: { id }})
        if(partnerSelected){
            res.status(200).json({message: 'Sócio excluído com sucesso.'})
        }else{
            res.status(404).json({message: 'Sócio não encontrado'})
        }
    }
}

module.exports = divisionPartnersController