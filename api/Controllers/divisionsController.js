const User = require('../Models/User.js')
const Division = require('../Models/Division.js')
const Lot = require('../Models/Lot.js')
const LotImage = require('../Models/LotImage.js')
const Partner = require('../Models/Partner.js')
const DivisionPartner = require('../Models/DivisionPartner.js')

// to do: crud divisions, crud lots and updates in lot views and lotQuantity inside Division model
class divisionsController { 
    static listDivisionsAndTheirLots = async(req, res) =>{
        let divisionsList = await Division.findAll({
            include: [{
              model: Lot,
              as: 'lotes',
              required: false,
              include: [{
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
            },
            {
             model: DivisionPartner,
             as: 'divisionPartners',
             required: false,
            }],
          })
        //   divisionsList.lotes.sort((a,b) =>{
        //     return new Date(b.updatedAt) - new Date(a.updatedAt);
        //   })
          divisionsList.sort(function(a,b){
            return new Date(b.updatedAt) - new Date(a.updatedAt);
          });
        if(divisionsList){
            res.status(200).json(divisionsList)
        }else{
            res.status(400).json({message: "Ocorreu um erro na requisição, tente novamente."})
        }
    }
    static listDivisionById = async(req, res) =>{
        let {id: divisionId} = req.params
        let divisionSelected = await Division.findAll({where: {id: divisionId},            
            include: [{
                model: Lot,
                as: 'lotes',
                required: false,
                include: [{
                  model: LotImage,
                  as: 'loteImages',
                  required: false
               }
              ]
              },
              {
               model: DivisionPartner,
               as: 'divisionPartners',
               required: false,
              }]})
        if(divisionSelected.length == 1){
            res.status(200).json(divisionSelected)
        }else{
            res.status(404).json({message: 'Loteamento não encontrado'})
        }
    }
    static addNewDivision = async (req, res) =>{
        // Logo and blueprint will be a imgur url to the image
        let { name, logo, location, bluePrint, divisionPartners } = req.body
        let newDivision = await Division.create({
            name: name,
            logoUrl: logo,
            lotsQuantity: 0,
            location: location,
            bluePrint: bluePrint,
            divisionPartners: divisionPartners
        })
        if(newDivision){
            res.status(200).json({message: "Novo loteamento criado com sucesso.", data: newDivision})
        }else{
            res.status(400).json({message: "Ocorreu um erro na requisição, tente novamente."})
        }
    }

    static editExistingDivision = async (req, res) =>{
        // Logo and blueprint will be a imgur url to the image
        let id = parseInt(req.params.id)
        let { name, logo, location, bluePrint, divisionPartners } = req.body

        let updateDivision = await Division.update({
            name: name,
            logoUrl: logo,
            location: location,
            bluePrint: bluePrint,
            divisionPartners: divisionPartners
        },
        {
            where: { id: id }
        }
        )
        console.log(req.body)
        let updatedDivision = await Division.findAll({where: {id: id},
            include: [{
                model: Lot,
                as: 'lotes',
                required: false,
                include: [{
                  model: LotImage,
                  as: 'loteImages',
                  required: false
               }
              ]
              },
              {
               model: DivisionPartner,
               as: 'divisionPartners',
               required: false,
              }]});

        if(updateDivision){
            res.status(200).json({message: "Loteamento atualizado com sucesso.", data: updatedDivision})
            console.log(updatedDivision)
        }else{
            res.status(400).json({message: "Ocorreu um erro na requisição, tente novamente."})
        }
    }
    static deleteDivision = async(req, res) =>{
        let {id: divisionId} = req.params
        console.log(divisionId)
        let divisionSelected = await Division.destroy({where: {id: divisionId}})
        console.log(divisionSelected)
        if(divisionSelected){
            res.status(200).json({message: 'Loteamento excluído com sucesso.'})
        }else{
            res.status(404).json({message: 'Loteamento não encontrado'})
        }
    }
}

module.exports = divisionsController