require('dotenv').config()
const Sale = require('../Models/Sale')
const Lot = require('../Models/Lot')
const User = require('../Models/User')
const Partner = require('../Models/Partner')
const credentials = require('../config/gerencianet')
const Gerencianet = require('gn-api-sdk-node');
const Parcel = require('../Models/Parcel')
const LotImage = require('../Models/LotImage')
const querystring = require('querystring');
const Division = require('../Models/Division')
const DivisionPartner = require('../Models/DivisionPartner')


/*
regras:
    As parcelas anuais são criadas no momento da venda, são 12 no total
    As datas das parcelas anuais são definidas pelo cliente no momento da venda
    Todos os meses a data de vencimento vai ser o mesmo dia da data da primeira parcela
    Caso as parcelas sejam mais de 12, a partir da 13° parcela, o valor será o valor da parcela + valor acumulado do IGPM
    Ao listar as vendas, cada parcela deve ter o status verificado e atualizado
*/
const options = {
    client_id: credentials.client_id,
    client_secret: credentials.client_secret,
    sandbox: true,
    pix_cert: credentials.pix_cert,
};
const gerencianet = new Gerencianet(options);

class salesController {
    static verifyDiscount = async (discount) => {
        if (discount > 0) {
            return ({
                discount: {
                    type: 'percentage',
                    value: discount
                }
            }
            )
        }
    }
    static createParcels = async (quantity, saleData, salePriceFromRequest) => {
        saleData.salePrice = salePriceFromRequest
        let salePrice;
        let anualValue;
        let entryValue;
        let parcelPrice;
        let anualTaxValue;
        let parcelsCreated = [];
        let discountPercentage = (saleData.discountPercentage * 100);
        if (quantity <= 12) {
            salePrice = parseInt(saleData.salePrice * 100)
            entryValue = parseInt(saleData.entryValue * 100)
            anualTaxValue = salePrice * (saleData.fixedTaxPercetage / 100)
            salePrice -= entryValue
            parcelPrice = salePrice / quantity
            anualValue = Math.round((parcelPrice * quantity) + anualTaxValue)
        }
        else {
            salePrice = parseInt(saleData.salePrice * 100)
            entryValue = parseInt(saleData.entryValue * 100)
            anualTaxValue = salePrice * (saleData.fixedTaxPercetage / 100)
            salePrice -= entryValue
            parcelPrice = salePrice / quantity
            anualValue = Math.round((parcelPrice * 12) + anualTaxValue)
            quantity = 12
        }
        try {
            let saleDateYear = new Date(saleData.saleDate).getFullYear()
            let saleDateMonth = new Date(saleData.saleDate).getMonth() + 1 < 10 ? ((new Date(saleData.saleDate).getMonth() + 1).toString().padStart(2, '0')) : (new Date(saleData.saleDate).getMonth() + 1)
            let saleDateDay = new Date(saleData.saleDate).getDate() + 1 < 10 ? ((new Date(saleData.saleDate).getDate() + 1).toString().padStart(2, '0')) : (new Date(saleData.saleDate).getDate() + 1)
            let saleDateFormatted = `${saleDateYear}-${saleDateMonth}-${saleDateDay}`
            if (entryValue > 0) {
                saleDateFormatted = `${saleDateYear}-${(parseInt(saleDateMonth) + 1).toString().padStart(2, '0')}-${saleDateDay}`
            }
            /* Se o numero de parcelas == 1, criar apenas 1 boleto */
            if (quantity == 1) {
                console.log('Entrou no if quantity == 1')
                let uniqueParcelBody = {}
                if (discountPercentage > 0) {
                    uniqueParcelBody = {
                        items: [
                            {
                                name: saleData.lotes.name,
                                value: anualValue,
                                amount: 1
                            }
                        ],
                        payment: {
                            banking_billet: {
                                customer: {
                                    name: saleData.users.name,
                                    email: saleData.users.email,
                                    cpf: saleData.users.CPF,
                                    phone_number: saleData.users.phone
                                },
                                expire_at: saleDateFormatted,
                                configurations: {
                                    fine: 200,
                                    interest: 100
                                },
                                message: "Documento de pagamento à vista referente ao lote" + saleData.lotes.name,
                                discount: {
                                    type: 'percentage',
                                    value: discountPercentage
                                },
                            },
                        },
                        metadata: {
                            notification_url: process.env.NGROK_URL + '/sales/status/update'
                        },
                        // Porcentagem de acrescimo apos o vencimento

                    }
                } else {
                    uniqueParcelBody = {
                        items: [
                            {
                                name: saleData.lotes.name,
                                value: anualValue,
                                amount: 1
                            }
                        ],
                        payment: {
                            banking_billet: {
                                customer: {
                                    name: saleData.users.name,
                                    email: saleData.users.email,
                                    cpf: saleData.users.CPF,
                                    phone_number: saleData.users.phone
                                },
                                expire_at: saleDateFormatted,
                                message: "Documento de pagamento à vista referente ao lote" + saleData.lotes.name,
                            },
                        },
                        metadata: {
                            notification_url: process.env.NGROK_URL + '/sales/status/update'
                        },
                        // Porcentagem de acrescimo apos o vencimento
                        configurations: {
                            fine: 200,
                            interest: 100
                        },


                    }
                }

                await gerencianet.createOneStepCharge({}, uniqueParcelBody).then(chargeRes => {
                    parcelsCreated.push({
                        saleId: saleData.id,
                        expireDate: chargeRes.data.expire_at,
                        value: chargeRes.data.total,
                        mulct: 0,
                        status: chargeRes.data.status,
                        billetLink: chargeRes.data.billet_link,
                        billetPdf: chargeRes.data.pdf.charge,
                        chargeId: chargeRes.data.charge_id,
                    }
                    )
                }).catch(err => console.log(err))
                parcelsCreated.flat()
            }
            /* Se o valor de entrada > 0, criar 1 boleto com o valor da entrada e as demais parcelas */
            if (quantity > 1 && entryValue > 0) {
                console.log('Entrou no if quantity > 1 && entryValue > 0')
                let entryParcelBody;
                let anualParcelsWithEntryBody;
                if (discountPercentage > 0) {
                    entryParcelBody = {
                        items: [
                            {
                                name: saleData.lotes.name,
                                value: entryValue,
                                amount: 1
                            }
                        ],
                        payment: {
                            banking_billet: {
                                customer: {
                                    name: saleData.users.name,
                                    email: saleData.users.email,
                                    cpf: saleData.users.CPF,
                                    phone_number: saleData.users.phone
                                },
                                expire_at: saleDateFormatted,
                                // Porcentagem de acrescimo apos o vencimento
                                configurations: {
                                    fine: 200,
                                    interest: 100
                                },
                                message: "Documento de pagamento à vista referente ao lote" + saleData.lotes.name,
                                discount: {
                                    type: 'percentage',
                                    value: discountPercentage
                                },

                            },
                        },
                        metadata: {
                            notification_url: process.env.NGROK_URL + '/sales/status/update'
                        },


                    }
                    anualParcelsWithEntryBody = {
                        items: [
                            {
                                name: saleData.lotes.name,
                                value: anualValue,
                                amount: 1
                            }
                        ],
                        customer: {
                            name: saleData.users.name,
                            email: saleData.users.email,
                            cpf: saleData.users.CPF,
                            phone_number: saleData.users.phone
                        },
                        expire_at: saleDateFormatted,
                        // Porcentagem de acrescimo apos o vencimento
                        configurations: {
                            fine: 200,
                            interest: 100
                        },
                        message: "Esta parcela é referente ao lote" + saleData.lotes.name,
                        discount: {
                            type: 'percentage',
                            value: discountPercentage
                        },
                        repeats: quantity - 1,
                        split_items: true,
                        metadata: {
                            notification_url: process.env.NGROK_URL + '/sales/status/update'
                        }
                    }
                } else {
                    entryParcelBody = {
                        items: [
                            {
                                name: saleData.lotes.name,
                                value: entryValue,
                                amount: 1
                            }
                        ],
                        payment: {
                            banking_billet: {
                                customer: {
                                    name: saleData.users.name,
                                    email: saleData.users.email,
                                    cpf: saleData.users.CPF,
                                    phone_number: saleData.users.phone
                                },
                                expire_at: saleDateFormatted,
                                message: "Documento de valor de entrada referente ao lote" + saleData.lotes.name,
                                metadata: {
                                    notification_url: process.env.NGROK_URL + '/sales/status/update'
                                },
                                configurations: {
                                    fine: 200,
                                    interest: 100
                                },
                            },
                        },
                        // Porcentagem de acrescimo apos o vencimento



                    }

                    anualParcelsWithEntryBody = {
                        items: [
                            {
                                name: saleData.lotes.name,
                                value: anualValue,
                                amount: 1
                            }
                        ],
                        customer: {
                            name: saleData.users.name,
                            email: saleData.users.email,
                            cpf: saleData.users.CPF,
                            phone_number: saleData.users.phone
                        },
                        expire_at: saleDateFormatted,
                        // Porcentagem de acrescimo apos o vencimento
                        configurations: {
                            fine: 200,
                            interest: 100
                        },
                        message: "Esta parcela é referente ao lote" + saleData.lotes.name,
                        repeats: quantity - 1,
                        split_items: true,
                        metadata: {
                            notification_url: process.env.NGROK_URL + '/sales/status/update'
                        }
                    }
                }
                await gerencianet.createOneStepCharge({}, entryParcelBody)
                    .then(chargeRes => {
                        parcelsCreated.push({
                            saleId: saleData.id,
                            expireDate: chargeRes.data.expire_at,
                            value: chargeRes.data.total,
                            mulct: 0,
                            status: chargeRes.data.status,
                            billetLink: chargeRes.data.billet_link,
                            billetPdf: chargeRes.data.pdf.charge,
                            chargeId: chargeRes.data.charge_id,
                        })
                        // console.log('Boleto inicial criado com sucesso')
                    })
                    .then(async () => {
                        await gerencianet.createCarnet({}, anualParcelsWithEntryBody)
                            .then(async chargeRes => {
                                await chargeRes.data.charges.forEach(async charge => {
                                    parcelsCreated.push({
                                        saleId: saleData.id,
                                        expireDate: charge.expire_at,
                                        value: charge.value,
                                        mulct: 0,
                                        status: charge.status,
                                        billetLink: charge.parcel_link,
                                        billetPdf: charge.pdf.charge,
                                        chargeId: charge.charge_id,
                                    })
                                })
                                // console.log('Parcelas anuais criadas com sucesso')
                            })
                            .catch(err => {
                                console.log(err)
                            })

                    })
                    .finally(() => {
                        parcelsCreated = parcelsCreated.reduce((acc, val) => acc.concat(val), [])
                    })
            }
            /* Se o valor de entrada == 0, criar apenas as parcelas anuais */
            if (quantity > 1 && entryValue == 0) {
                console.log('Entrou no if quantity > 1 && entryValue == 0')
                var anualParcelsWithNoEntryBody = {
                    items: [
                        {
                            name: saleData.lotes.name,
                            value: anualValue,
                            amount: 1
                        }
                    ],
                    customer: {
                        name: saleData.users.name,
                        email: saleData.users.email,
                        cpf: saleData.users.CPF,
                        phone_number: saleData.users.phone
                    },
                    expire_at: saleDateFormatted,
                    // Porcentagem de acrescimo apos o vencimento
                    configurations: {
                        fine: 200,
                        interest: 100
                    },
                    message: "Esta é uma parcela anual referente a compra do lote " + saleData.lotes.name,
                    repeats: quantity,
                    split_items: true,
                    metadata: {
                        notification_url: process.env.NGROK_URL + '/sales/status/update'
                    }
                }
                await gerencianet.createCarnet({}, anualParcelsWithNoEntryBody).then(async chargeRes => {
                    await chargeRes.data.charges.forEach(async charge => {
                        parcelsCreated.push({
                            saleId: saleData.id,
                            expireDate: charge.expire_at,
                            value: charge.value,
                            mulct: 0,
                            status: charge.status,
                            billetLink: charge.parcel_link,
                            billetPdf: charge.pdf.charge,
                            chargeId: charge.charge_id,
                        })
                    })
                }).finally(() => {
                    parcelsCreated = parcelsCreated.reduce((acc, val) => acc.concat(val), [])
                })
            }

            if (parcelsCreated.length > 0) {
                const addParcelPromises = await Parcel.bulkCreate(parcelsCreated);
                const addParcelResults = await Promise.all(addParcelPromises);
                // Check if all the promises resolved successfully
                const allPromisesResolved = addParcelResults.every((result) => result);
                if (allPromisesResolved) {
                    return true;
                } else {
                    return false;
                }
            }
        } catch (error) {
            console.log(error)
            return false
        }
        // }
    }
    static createSaleAndTheirAnualParcels = async (req, res) => {
        const {
            saleDate,
            salePrice,
            status,
            commission,
            fixedTaxPercetage,
            variableTaxPercetage,
            contract,
            loteId,
            buyerId,
            parcelsQuantity,
            entryValue,
            discountPercentage,
        } = req.body
        // commission = desconto(em porcentagem)
        let createdSale = await Sale.create({
            saleDate,
            salePrice: ((salePrice + parseFloat(salePrice)*parseFloat(fixedTaxPercetage/100))*100),
            commission,
            status,
            discountPercentage,
            fixedTaxPercetage,
            variableTaxPercetage,
            contract,
            loteId,
            buyerId,
            entryValue,
            parcelsQuantity
        })

        if (!createdSale) {
            res.status(400).json({ message: "Erro ao criar venda" })
        } else {
            // Integrar API de criação de contratos
            // https://sandbox.clicksign.com
            
            await Sale.findByPk(createdSale.id, {
                include: [
                    {
                        model: Lot,
                        as: 'lotes',
                        required: false,
                        include: [
                            {
                                model: LotImage,
                                as: 'loteImages',
                                required: false,
                            },
                            {
                                model: Partner,
                                as: 'lotePartners',
                                required: false
                            }
                        ]
                    },
                    {
                        model: User,
                        as: 'users',
                        required: false,
                    }
                ]
            }).then(async sale => {
                let saleParcels = await this.createParcels(parcelsQuantity, sale, salePrice)
                if (saleParcels) {
                    let saleCreatedData = await Sale.findByPk(createdSale.id, {
                        include: [
                            {
                                model: Lot,
                                as: 'lotes',
                                required: false,
                                include: [
                                    {
                                        model: LotImage,
                                        as: 'loteImages',
                                        required: false,
                                    },
                                    {
                                        model: Partner,
                                        as: 'lotePartners',
                                        required: false
                                    }
                                ]
                            },
                            {
                                model: User,
                                as: 'users',
                                required: false,
                            }
                        ]
                    })
                    if (saleCreatedData) {
                        res.status(200).json({ message: "Venda criada com sucesso!", data: saleCreatedData })
                    } else {
                        res.status(400).json({ message: "Erro ao criar venda" })
                    }
                } else {
                    res.status(400).json({ message: "Erro ao criar parcelas" })
                }
            }).catch(err => {
                console.log(err)
                res.status(500).json({ message: "Erro no servidor" })
            })
        }
    }
    static listAllSales = async (req, res) => {
        let salesList = await Sale.findAll({
            include: [
                {
                    model: Parcel,
                    as: 'parcelas',
                    required: true,
                },
                {
                    model: Lot,
                    as: 'lotes',
                    required: false,
                    include: [{
                        model: LotImage,
                        as: 'loteImages',
                        required: false
                    }, {
                        model: Partner,
                        as: 'lotePartners',
                        required: false
                    },
                    ]
                },
                {
                    model: User,
                    as: 'users',
                    required: false,
                    fields: ['id', 'name', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        })
        if (!salesList) {
            res.status(500).json({ message: 'Erro no servidor.' })
        } else {
            res.status(200).json(salesList)
        }
    }
    static listSaleById = async (req, res) => {
        const { id } = req.params
        let sale = await Sale.findByPk(id, {
            include: [
                {
                    model: Parcel,
                    as: 'parcelas',
                    required: false,
                },
                {
                    model: Lot,
                    as: 'lotes',
                    required: false,
                    include: [{
                        model: LotImage,
                        as: 'loteImages',
                        required: false
                    }, {
                        model: Partner,
                        as: 'lotePartners',
                        required: false
                    }
                    ]
                },
                {
                    model: User,
                    as: 'users',
                    required: false,
                }
            ]
        })
        if (!sale) {
            res.status(500).json({ message: 'Erro no servidor.' })
        } else {
            res.status(200).json(sale)
        }
    }
    static updateSaleStatus = async (req, res) => {
        // console.log('\x1b[36m%s\x1b[0m','Recebendo atualizações de status de vendas')
        let { notification } = req.body
        // console.log(notification)
        let params = {
            token: notification
        }
        let saleData = await gerencianet.getNotification(params, {}).then((response) => response.data).catch((error) => console.log(error))
        saleData.shift()
        await saleData.forEach(async (parcel) => {
            // console.log({ type: parcel.type, id: parcel.identifiers.charge_id })
            if (parcel.status.current !== 'waiting' && parcel.status.current !== 'new') {
                Parcel.update({ status: parcel.status.current }, { where: { chargeId: parcel.identifiers.charge_id } })
                    .catch((error) => {
                        console.log(error)
                    })
            }
        })
        // console.log('\x1b[36m%s\x1b[0m','Atualização de status de vendas concluída')
        res.status(200).end()
    }

}

module.exports = salesController

