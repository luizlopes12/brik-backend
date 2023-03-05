const TaxValues = require('../Models/TaxValues.js')
const Lot = require('../Models/Lot.js')

class TaxController {
    static listAllTaxesValues = async (req, res) => {
        TaxValues.findAll({limit: 1})
        .then(taxes => res.status(200).json(taxes))
        .catch(err => res.status(500).json(err))
    }
    static updateTaxValues = async (req, res) => {
        let { defaultTax, after24Months } = req.body
        let updatedTax = TaxValues.update({defaultTax, after24Months}, {where: {id: 1}})
        let updatedLotTax = Lot.update({ 
            taxPercentage: defaultTax, 
            taxPercentage24: after24Months 
        }, {where: {}})
        if(updatedLotTax && updatedTax){
            res.status(200).json({ message: 'Juros atualizadas com sucesso!' })
        } else {
            res.status(500).json({ message: 'Erro ao atualizar juros' })
        }
    }
}

module.exports = TaxController