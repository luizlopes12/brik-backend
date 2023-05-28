const cron = require('node-cron');
const Sale = require('../Models/Sale')
const credentials = require('../config/gerencianet')
const Gerencianet = require('gn-api-sdk-node');
const Parcel = require('../Models/Parcel')
const Notification = require('../Models/Notification')
const gerencianet = new Gerencianet(credentials);
const fetch = require('node-fetch');
const Lot = require('../Models/Lot')
const LotImage = require('../Models/LotImage')
const Partner = require('../Models/Partner')
const User = require('../Models/User')
const app = require('../index.js')
const io = require('socket.io')(app)



// Path: backend\api\crons\createNewParcels.js
// 0 0 1 * * - Run at 00:00:00 on day-of-month 1.
/*
    check if is the last parcel of the year and if it is, create new parcels for the next year,
    with the tax percentage of igpm and notify the admin
*/





module.exports = cron.schedule('* * * * *', async () => {
    let accumulatedIGPMValue = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.4175/dados?formato=json')
        .then(response => response.json())
        .then(data => {
            let valueToReturn = data.slice(-12).reduce((acc, current) => {
                const currentValue = parseFloat(current.valor);
                return isNaN(currentValue) ? acc : acc + currentValue;
            }, 0);
            return valueToReturn
        })
        .catch(error => console.error(error));

    console.log('\x1b[36m%s\x1b[0m','Rodando CRON de criação de novas parcelas...')
    const currentDate = new Date('2024-02-25');
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    let lastParcel;
    // Find all sales that have a last parcel with a matching year and month
    try {
        const salesToUpdate = await Sale.findAll({
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
                    }
                    ]
                },
                {
                    model: User,
                    as: 'users',
                    required: false,
                }
            ],
        });
        salesToUpdate.forEach(async (sale) => {
            let salePrice = sale.salePrice;
            let anualValue;
            let anualTaxValue;
            let parcelPrice;
            let parcelsCreated = [];
            lastParcel = sale.parcelas.reduce((prev, current) => {
                if (prev.expireDate > current.expireDate) {
                    return prev;
                }
                return current;
            });
            let lastParcelDate = new Date(lastParcel.expireDate);
            let nextParcelDate = `${lastParcelDate.getFullYear()}-${(parseInt(lastParcelDate.getMonth()) + 2).toString().padStart(2, '0')}-${(parseInt(lastParcelDate.getDate()) + 1).toString().padStart(2, '0')}`;
            let remainingParcels = sale.parcelsQuantity - sale.parcelas.length;
            if (
                ((lastParcelDate.getFullYear()) === currentYear) &&
                ((lastParcelDate.getMonth() + 1) === currentMonth) &&
                (sale.parcelsQuantity > sale.parcelas.length) &&
                (sale.parcelsQuantity > 12 && remainingParcels !== 0)
            ) {
                // To do: create future parcels based on IGPM as tax percentage and notify the admin
                if (remainingParcels > 0 && remainingParcels <= 12) {
                    remainingParcels = remainingParcels
                    anualTaxValue = parseInt((parseInt(parseFloat(salePrice) * parseFloat(accumulatedIGPMValue)))/12*remainingParcels)
                } else if (remainingParcels > 12) {
                    remainingParcels = 12;
                    anualTaxValue = (parseInt(parseFloat(salePrice) * parseFloat(accumulatedIGPMValue)))
                }
                salePrice = parseInt(sale.salePrice * 100)
                parcelPrice = parseInt(parseFloat(salePrice) / parseFloat(sale.parcelsQuantity))
                anualValue = Math.round(parcelPrice * remainingParcels)
                var newAnualParcels = {
                    items: [
                        {
                            name: sale.lotes.name,
                            value: anualValue,
                            amount: 1
                        },
                        {
                            name: `Juros anuais(${accumulatedIGPMValue}%)`,
                            value: anualTaxValue,
                            amount: 1
                        }

                    ],
                    customer: {
                        name: sale.users.name,
                        email: sale.users.email,
                        cpf: sale.users.CPF,
                        phone_number: sale.users.phone
                    },
                    expire_at: nextParcelDate,
                    // Porcentagem de acrescimo apos o vencimento
                    // configurations: {
                    //     fine: 200,
                    //     interest: 100
                    // },
                    message: "Esta é uma parcela anual referente a compra do lote " + sale.lotes.name,
                    repeats: remainingParcels,
                    split_items: true,
                    metadata: {
                        // Adicionar endpoint para o webhook onde vai atualizar o status da parcela
                        // notification_url: ''
                    }
                }
                await gerencianet.createCarnet({}, newAnualParcels)
                    .then(async chargeRes => {
                        await chargeRes.data.charges.forEach(async charge => {
                            parcelsCreated.push({
                                saleId: sale.id,
                                expireDate: charge.expire_at,
                                value: charge.value,
                                mulct: 0,
                                status: charge.status,
                                billetLink: charge.parcel_link,
                                billetPdf: charge.pdf.charge,
                                chargeId: charge.charge_id,
                            })
                        })
                    })

                    .catch(err => {
                        console.log(err)
                    })
                    .finally(() => {
                        parcelsCreated = parcelsCreated.reduce((acc, val) => acc.concat(val), [])
                    })
                    if(parcelsCreated.length > 0){
                        await Parcel.bulkCreate(parcelsCreated)
                        .then(async () => {
                            /* Criar notificação de novas parcelas */
                            console.log(`Criando novas parcelas, venda: ${sale.id}.`)
                            Notification.create({
                                notificationUserId: sale.userId,
                                title: `Novas parcelas anuais criadas`,
                                description: `Foram criadas novas parcelas anuais para a venda do lote ${sale.lotes.name}.`,
                                actionLink: 'Link para a alteração dos juros das parcelas',
                                opened: false
                            }).then(async () => {
                                io.sockets.emit('notification', {
                                    notificationUserId: sale.userId,
                                    title: `Novas parcelas anuais criadas`,
                                    description: `Foram criadas novas parcelas anuais para a venda do lote ${sale.lotes.name}.`,
                                    actionLink: 'Link para a alteração dos juros das parcelas',
                                    opened: false
                                });
                            })
                        })
                }
            }
            else if (remainingParcels == 0 && lastParcel.status == 'paid' && sale.status !== 'paid') {
            const allPaid = await sale.parcelas.every(parcel => parcel.status === 'paid')
            if(allPaid){
                await Sale.update({
                    status: 'Pago'
                }, {
                    where: {
                        id: sale.id
                    }
                }).then(async () => {
                    Notification.create({
                        notificationUserId: sale.userId,
                        title: `Novas parcelas anuais criadas`,
                        description: `Foram criadas novas parcelas anuais para a venda do lote ${sale.lotes.name}.`,
                        actionLink: 'Link para a alteração dos juros das parcelas',
                        opened: false
                    })
                    io.sockets.emit('notification', {
                        notificationUserId: sale.userId,
                        title: `Pagamento do lote ${sale.lotes.name} finalizado.`,
                        description: `O pagamento das parcelas do lote ${sale.lotes.name} foi finalizado.`,
                        actionLink: 'Link para visualizar as parcelas do lote',
                        opened: false
                    });
                })
            }
                console.log(`Não há parcelas a serem criadas, venda: ${sale.id} finalizada.`)
            }
        })
    } catch (error) {
        console.log('Erro na CRON createNewParcels.js, erro: ' + error);
    }

    console.log('\x1b[36m%s\x1b[0m','CRON de criação de novas parcelas finalizada.')
});
