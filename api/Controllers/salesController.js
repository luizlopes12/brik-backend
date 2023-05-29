require("dotenv").config();
const Sale = require("../Models/Sale");
const Lot = require("../Models/Lot");
const User = require("../Models/User");
const Partner = require("../Models/Partner");
const credentials = require("../config/gerencianet");
const Gerencianet = require("gn-api-sdk-node");
const Parcel = require("../Models/Parcel");
const LotImage = require("../Models/LotImage");
const querystring = require("querystring");
const Division = require("../Models/Division");
const DivisionPartner = require("../Models/DivisionPartner");
const { Op } = require("sequelize");
const { Sequelize } = require("../config/database");
const nodemailer = require("nodemailer");
const Contract = require("../Models/Contract");
const io = require('../io.js');

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

const numeroPorExtenso = (num) => {
  let unidades = [
    "",
    "um",
    "dois",
    "três",
    "quatro",
    "cinco",
    "seis",
    "sete",
    "oito",
    "nove",
  ];
  let dezenas = [
    "",
    "dez",
    "vinte",
    "trinta",
    "quarenta",
    "cinquenta",
    "sessenta",
    "setenta",
    "oitenta",
    "noventa",
  ];
  let especiais = [
    "dez",
    "onze",
    "doze",
    "treze",
    "quatorze",
    "quinze",
    "dezesseis",
    "dezessete",
    "dezoito",
    "dezenove",
  ];
  let milhares = [
    "",
    "mil",
    "milhões",
    "bilhões",
    "trilhões",
    "quatrilhões",
    "quintilhões",
    "sextilhões",
    "setilhões",
    "octilhões",
    "nonilhões",
  ];

  if (num === 0) {
    return "zero";
  }

  let extenso = "";
  let resto = num;

  for (let i = 9; i >= 0; i--) {
    let potencia = 10 ** (3 * i);
    let parte = Math.floor(resto / potencia);
    resto -= parte * potencia;

    if (parte === 0) {
      continue;
    }

    let centenas = "";
    let dezenasEspeciais = "";
    let dezenasVazias = "";
    let unidadesExtenso = "";

    if (parte >= 100) {
      centenas = `${unidades[parte / 100]}cento `;
      parte %= 100;
    }

    if (parte >= 10 && parte < 20) {
      dezenasEspeciais = `${especiais[parte - 10]} `;
      parte = 0;
    } else if (parte >= 20) {
      dezenasVazias = `${dezenas[parte / 10]} `;
      parte %= 10;
    }

    if (parte >= 1 && parte <= 9) {
      unidadesExtenso = `${unidades[parte]} `;
    }

    let milharExtenso = milhares[i];
    extenso += `${centenas}${dezenasEspeciais}${dezenasVazias}${unidadesExtenso}${milharExtenso} `;
  }

  return extenso.trim();
};

class salesController {
  static verifyDiscount = async (discount) => {
    if (discount > 0) {
      return {
        discount: {
          type: "percentage",
          value: discount,
        },
      };
    }
  };
  static createParcels = async (quantity, saleData, salePriceFromRequest) => {
    let selectedContract = await Contract.findOne({
      where: {
        loteId: saleData.lotes.id,
      },
    });
    
    saleData.users = {};
    
    saleData.users.name = await selectedContract.name;
    saleData.users.email = await selectedContract.email;
    saleData.users.CPF = await selectedContract.cpf;
    saleData.users.phone = await selectedContract.telefone;
    

    saleData.salePrice = salePriceFromRequest;
    let salePrice;
    let anualValue;
    let entryValue;
    let parcelPrice;
    let anualTaxValue;
    let parcelsCreated = [];
    let discountPercentage = saleData.discountPercentage * 100;
    if (quantity <= 12) {
      salePrice = parseInt(saleData.salePrice * 100);
      entryValue = parseInt(saleData.entryValue * 100);
      anualTaxValue = salePrice * (saleData.fixedTaxPercetage / 100);
      salePrice -= entryValue;
      parcelPrice = salePrice / quantity;
      anualValue = Math.round(parcelPrice * quantity + anualTaxValue);
    } else {
      salePrice = parseInt(saleData.salePrice * 100);
      entryValue = parseInt(saleData.entryValue * 100);
      anualTaxValue = salePrice * (saleData.fixedTaxPercetage / 100);
      salePrice -= entryValue;
      parcelPrice = salePrice / quantity;
      anualValue = Math.round(parcelPrice * 12 + anualTaxValue);
      quantity = 12;
    }
    try {
      let saleDateYear = new Date(saleData.saleDate).getFullYear();
      let saleDateMonth =
        new Date(saleData.saleDate).getMonth() + 1 < 10
          ? (new Date(saleData.saleDate).getMonth() + 1)
              .toString()
              .padStart(2, "0")
          : new Date(saleData.saleDate).getMonth() + 1;
      let saleDateDay =
        new Date(saleData.saleDate).getDate() + 1 < 10
          ? (new Date(saleData.saleDate).getDate() + 1)
              .toString()
              .padStart(2, "0")
          : new Date(saleData.saleDate).getDate() + 1;
      let saleDateFormatted = `${saleDateYear}-${saleDateMonth}-${saleDateDay}`;
      if (entryValue > 0) {
        saleDateFormatted = `${saleDateYear}-${(parseInt(saleDateMonth) + 1)
          .toString()
          .padStart(2, "0")}-${saleDateDay}`;
      }
      /* Se o numero de parcelas == 1, criar apenas 1 boleto */
      if (quantity == 1) {
        console.log("Entrou no if quantity == 1");
        let uniqueParcelBody = {};
        if (discountPercentage > 0) {
          uniqueParcelBody = {
            items: [
              {
                name: saleData.lotes.name,
                value: anualValue,
                amount: 1,
              },
            ],
            payment: {
              banking_billet: {
                customer: {
                  name: saleData.users.name,
                  email: saleData.users.email,
                  cpf: saleData.users.CPF,
                  phone_number: saleData.users.phone,
                },
                expire_at: saleDateFormatted,
                configurations: {
                  fine: 200,
                  interest: 100,
                },
                message:
                  "Documento de pagamento à vista referente ao lote" +
                  saleData.lotes.name,
                discount: {
                  type: "percentage",
                  value: discountPercentage,
                },
              },
            },
            metadata: {
              notification_url: process.env.NGROK_URL + "/sales/status/update",
            },
            // Porcentagem de acrescimo apos o vencimento
          };
        } else {
          uniqueParcelBody = {
            items: [
              {
                name: saleData.lotes.name,
                value: anualValue,
                amount: 1,
              },
            ],
            payment: {
              banking_billet: {
                customer: {
                  name: saleData.users.name,
                  email: saleData.users.email,
                  cpf: saleData.users.CPF,
                  phone_number: saleData.users.phone,
                },
                expire_at: saleDateFormatted,
                message:
                  "Documento de pagamento à vista referente ao lote" +
                  saleData.lotes.name,
              },
            },
            metadata: {
              notification_url: process.env.NGROK_URL + "/sales/status/update",
            },
            // Porcentagem de acrescimo apos o vencimento
            configurations: {
              fine: 200,
              interest: 100,
            },
          };
        }

        await gerencianet
          .createOneStepCharge({}, uniqueParcelBody)
          .then((chargeRes) => {
            parcelsCreated.push({
              saleId: saleData.id,
              expireDate: chargeRes.data.expire_at,
              value: chargeRes.data.total,
              mulct: 0,
              status: chargeRes.data.status,
              billetLink: chargeRes.data.billet_link,
              billetPdf: chargeRes.data.pdf.charge,
              chargeId: chargeRes.data.charge_id,
            });
          })
          .catch((err) => {
            console.log(err);
            return false;
          });
        parcelsCreated.flat();

      }
      /* Se o valor de entrada > 0, criar 1 boleto com o valor da entrada e as demais parcelas */
      if (quantity > 1 && entryValue > 0) {
        console.log("Entrou no if quantity > 1 && entryValue > 0");
        let entryParcelBody;
        let anualParcelsWithEntryBody;
        if (discountPercentage > 0) {
          entryParcelBody = {
            items: [
              {
                name: saleData.lotes.name,
                value: entryValue,
                amount: 1,
              },
            ],
            payment: {
              banking_billet: {
                customer: {
                  name: saleData.users.name,
                  email: saleData.users.email,
                  cpf: saleData.users.CPF,
                  phone_number: saleData.users.phone,
                },
                expire_at: saleDateFormatted,
                // Porcentagem de acrescimo apos o vencimento
                configurations: {
                  fine: 200,
                  interest: 100,
                },
                message:
                  "Documento de pagamento à vista referente ao lote" +
                  saleData.lotes.name,
                discount: {
                  type: "percentage",
                  value: discountPercentage,
                },
              },
            },
            metadata: {
              notification_url: process.env.NGROK_URL + "/sales/status/update",
            },
          };
          anualParcelsWithEntryBody = {
            items: [
              {
                name: saleData.lotes.name,
                value: anualValue,
                amount: 1,
              },
            ],
            customer: {
              name: saleData.users.name,
              email: saleData.users.email,
              cpf: saleData.users.CPF,
              phone_number: saleData.users.phone,
            },
            expire_at: saleDateFormatted,
            // Porcentagem de acrescimo apos o vencimento
            configurations: {
              fine: 200,
              interest: 100,
            },
            message: "Esta parcela é referente ao lote" + saleData.lotes.name,
            discount: {
              type: "percentage",
              value: discountPercentage,
            },
            repeats: quantity - 1,
            split_items: true,
            metadata: {
              notification_url: process.env.NGROK_URL + "/sales/status/update",
            },
          };
        } else {
          entryParcelBody = {
            items: [
              {
                name: saleData.lotes.name,
                value: entryValue,
                amount: 1,
              },
            ],
            payment: {
              banking_billet: {
                customer: {
                  name: saleData.users.name,
                  email: saleData.users.email,
                  cpf: saleData.users.CPF,
                  phone_number: saleData.users.phone,
                },
                expire_at: saleDateFormatted,
                message:
                  "Documento de valor de entrada referente ao lote" +
                  saleData.lotes.name,

                configurations: {
                  fine: 200,
                  interest: 100,
                },
              },
            },
            metadata: {
              notification_url: process.env.NGROK_URL + "/sales/status/update",
            },
            // Porcentagem de acrescimo apos o vencimento
          };

          anualParcelsWithEntryBody = {
            items: [
              {
                name: saleData.lotes.name,
                value: anualValue,
                amount: 1,
              },
            ],
            customer: {
              name: saleData.users.name,
              email: saleData.users.email,
              cpf: saleData.users.CPF,
              phone_number: saleData.users.phone,
            },
            expire_at: saleDateFormatted,
            // Porcentagem de acrescimo apos o vencimento
            configurations: {
              fine: 200,
              interest: 100,
            },
            message: "Esta parcela é referente ao lote" + saleData.lotes.name,
            repeats: quantity - 1,
            split_items: true,
            metadata: {
              notification_url: process.env.NGROK_URL + "/sales/status/update",
            },
          };
        }
        await gerencianet
          .createOneStepCharge({}, entryParcelBody)
          .then((chargeRes) => {
            parcelsCreated.push({
              saleId: saleData.id,
              expireDate: chargeRes.data.expire_at,
              value: chargeRes.data.total,
              mulct: 0,
              status: chargeRes.data.status,
              billetLink: chargeRes.data.billet_link,
              billetPdf: chargeRes.data.pdf.charge,
              chargeId: chargeRes.data.charge_id,
            });
            // console.log('Boleto inicial criado com sucesso')
          })
          .then(async () => {
            await gerencianet
              .createCarnet({}, anualParcelsWithEntryBody)
              .then(async (chargeRes) => {
                await chargeRes.data.charges.forEach(async (charge) => {
                  parcelsCreated.push({
                    saleId: saleData.id,
                    expireDate: charge.expire_at,
                    value: charge.value,
                    mulct: 0,
                    status: charge.status,
                    billetLink: charge.parcel_link,
                    billetPdf: charge.pdf.charge,
                    chargeId: charge.charge_id,
                  });
                });
                // console.log('Parcelas anuais criadas com sucesso')
              })
              .catch((err) => {
                console.log(err);
                return false;
              });
          })
          .finally(() => {
            parcelsCreated = parcelsCreated.reduce(
              (acc, val) => acc.concat(val),
              []
            );
          });
      }
      /* Se o valor de entrada == 0, criar apenas as parcelas anuais */
      if (quantity > 1 && entryValue == 0) {
        console.log("Entrou no if quantity > 1 && entryValue == 0");
        var anualParcelsWithNoEntryBody = {
          items: [
            {
              name: saleData.lotes.name,
              value: anualValue,
              amount: 1,
            },
          ],
          customer: {
            name: saleData.users.name,
            email: saleData.users.email,
            cpf: saleData.users.CPF,
            phone_number: saleData.users.phone,
          },
          expire_at: saleDateFormatted,
          // Porcentagem de acrescimo apos o vencimento
          configurations: {
            fine: 200,
            interest: 100,
          },
          message:
            "Esta é uma parcela anual referente a compra do lote " +
            saleData.lotes.name,
          repeats: quantity,
          split_items: true,
          metadata: {
            notification_url: process.env.NGROK_URL + "/sales/status/update",
          },
        };
        await gerencianet
          .createCarnet({}, anualParcelsWithNoEntryBody)
          .then(async (chargeRes) => {
            await chargeRes.data.charges.forEach(async (charge) => {
              parcelsCreated.push({
                saleId: saleData.id,
                expireDate: charge.expire_at,
                value: charge.value,
                mulct: 0,
                status: charge.status,
                billetLink: charge.parcel_link,
                billetPdf: charge.pdf.charge,
                chargeId: charge.charge_id,
              });
            });
          })
          .catch((err) => {
            console.log(err);
            return false;
          })
          .finally(() => {
            parcelsCreated = parcelsCreated.reduce(
              (acc, val) => acc.concat(val),
              []
            );
          });
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
      console.log(error);
      return false;
    }
    // }
  };
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
      parcelsQuantity,
      entryValue,
      discountPercentage,
    } = req.body;
    let userInfo = await Contract.findOne({
      where: {
        loteId: loteId,
      },
    });
    
    // commission = desconto(em porcentagem)
    let createdSale = await Sale.create({
      saleDate,
      salePrice:
        (salePrice +
          parseFloat(salePrice) * parseFloat(fixedTaxPercetage / 100)) *
        100,
      commission,
      status,
      discountPercentage,
      fixedTaxPercetage,
      variableTaxPercetage,
      contract,
      loteId,
      entryValue,
      parcelsQuantity,
    });

    if (!createdSale) {
      res.status(400).json({ message: "Erro ao criar venda" });
    } else {
      // Integrar API de criação de contratos
      // https://sandbox.clicksign.com

      await Sale.findByPk(createdSale.id, {
        include: [
          {
            model: Lot,
            as: "lotes",
            required: false,
            include: [
              {
                model: LotImage,
                as: "loteImages",
                required: false,
              },
              {
                model: Partner,
                as: "lotePartners",
                required: false,
              },
            ],
          },
          {
            model: User,
            as: "users",
            required: false,
          },
        ],
      })
        .then(async (sale) => {
          // sale.entryValue = entryValue;
          console.log(entryValue)
          sale.users = {
            name: userInfo.name,
            email: userInfo.email,
            CPF: userInfo.cpf,
            phone: userInfo.telefone,
          };
          let saleParcels = await this.createParcels(
            parcelsQuantity,
            sale,
            salePrice
          );
          
          if (saleParcels) {
            let saleCreatedData = await Sale.findByPk(createdSale.id, {
              include: [
                {
                  model: Lot,
                  as: "lotes",
                  required: false,
                  include: [
                    {
                      model: LotImage,
                      as: "loteImages",
                      required: false,
                    },
                    {
                      model: Partner,
                      as: "lotePartners",
                      required: false,
                    },
                  ],
                },
                {
                  model: User,
                  as: "users",
                  required: false,
                },
              ],
            });
            if (saleCreatedData) {
              await Lot.update({ isSolded: true }, { where: { id: loteId } });
              res.status(200).json({
                message: "Venda criada com sucesso!",
                data: saleCreatedData,
              });
            } else {
              res.status(400).json({ message: "Erro ao criar venda" });
            }
          } else {
            res.status(400).json({ message: "Erro ao criar parcelas" });
          }
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({ message: "Erro no servidor" });
        });
    }
  };
  static listAllSales = async (req, res) => {
    let salesList = await Sale.findAll({
      include: [
        {
          model: Parcel,
          as: "parcelas",
          required: true,
        },
        {
          model: Lot,
          as: "lotes",
          required: false,
          include: [
            {
              model: LotImage,
              as: "loteImages",
              required: false,
            },
            {
              model: Partner,
              as: "lotePartners",
              required: false,
            },
          ],
        },
        {
          model: User,
          as: "users",
          required: false,
          fields: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    if (!salesList) {
      res.status(500).json({ message: "Erro no servidor." });
    } else {
      res.status(200).json(salesList);
    }
  };
  static listSaleById = async (req, res) => {
    const { id } = req.params;
    let sale = await Sale.findByPk(id, {
      include: [
        {
          model: Parcel,
          as: "parcelas",
          required: false,
        },
        {
          model: Lot,
          as: "lotes",
          required: false,
          include: [
            {
              model: LotImage,
              as: "loteImages",
              required: false,
            },
            {
              model: Partner,
              as: "lotePartners",
              required: false,
            },
          ],
        },
        {
          model: User,
          as: "users",
          required: false,
        },
      ],
    });
    if (!sale) {
      res.status(500).json({ message: "Erro no servidor." });
    } else {
      res.status(200).json(sale);
    }
  };
  static updateSaleStatus = async (req, res) => {
    // console.log('\x1b[36m%s\x1b[0m','Recebendo atualizações de status de vendas')
    let { notification } = req.body;
    // console.log(notification)
    let params = {
      token: notification,
    };
    let saleData = await gerencianet
      .getNotification(params, {})
      .then((response) => response.data)
      .catch((error) => console.log(error));
    saleData.shift();
    await saleData.forEach(async (parcel) => {
      // console.log({ type: parcel.type, id: parcel.identifiers.charge_id })
      if (
        parcel.status.current !== "waiting" &&
        parcel.status.current !== "new"
      ) {
        Parcel.update(
          { status: parcel.status.current },
          { where: { chargeId: parcel.identifiers.charge_id } }
        ).catch((error) => {
          console.log(error);
        });
      }
    });
    // console.log('\x1b[36m%s\x1b[0m','Atualização de status de vendas concluída')
    res.status(200).end();
  };
  static getChartData = async (req, res) => {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today - 30 * 24 * 60 * 60 * 1000);

      const monthlyResults = await Sale.findAll({
        attributes: [
          [Sequelize.fn("MONTH", Sequelize.col("saleDate")), "month"],
          [Sequelize.fn("YEAR", Sequelize.col("saleDate")), "year"],
          [Sequelize.fn("SUM", Sequelize.col("salePrice")), "sumOfSales"],
          [Sequelize.fn("COUNT", Sequelize.col("id")), "salesQuantity"],
        ],
        group: [
          Sequelize.fn("MONTH", Sequelize.col("saleDate")),
          Sequelize.fn("YEAR", Sequelize.col("saleDate")),
        ],
        where: {
          createdAt: {
            [Op.gte]: new Date(new Date().getFullYear(), 0, 1),
            [Op.lt]: new Date(new Date().getFullYear() + 1, 0, 1),
          },
        },
        raw: true,
      });

      const monthlySummary = monthlyResults.map((result) => ({
        month: `${result.month.toString().padStart(2, "0")}/${result.year}`,
        sumOfSales: parseInt(result.sumOfSales),
        salesQuantity: parseInt(result.salesQuantity),
      }));

      const dailyResults = await Sale.findAll({
        attributes: [
          [Sequelize.fn("DAY", Sequelize.col("saleDate")), "day"],
          [Sequelize.fn("MONTH", Sequelize.col("saleDate")), "month"],
          [Sequelize.fn("SUM", Sequelize.col("salePrice")), "sumOfSales"],
          [Sequelize.fn("COUNT", Sequelize.col("id")), "salesQuantity"],
        ],
        group: [
          Sequelize.fn("DAY", Sequelize.col("saleDate")),
          Sequelize.fn("MONTH", Sequelize.col("saleDate")),
        ],
        where: {
          saleDate: {
            [Op.gte]: thirtyDaysAgo,
            [Op.lt]: today,
          },
        },
        raw: true,
      });

      const dailySummary = dailyResults.map((result) => ({
        day: `${result.day.toString().padStart(2, "0")}/${result.month
          .toString()
          .padStart(2, "0")}`,
        sumOfSales: parseInt(result.sumOfSales),
        salesQuantity: parseInt(result.salesQuantity),
      }));

      res.status(200).json({ monthlySummary, dailySummary });
    } catch (error) {
      res.status(500).json({
        message: "An error occurred while processing your request",
        error,
      });
    }
  };

  static sendClickSignEmail = async (req, res) => {
    const { name: buyerName, email: buyerEmail } = req.body.buyer;
    const { name: sellerName, email: sellerEmail } = req.body.seller;
    const { loteId, parcelsQuantity, entryValue, initDate} = req.body;
    const urlToForm = `${process.env.FRONTEND_URL}contract/form/${loteId}`;
    const selectedLote = await Lot.findByPk(loteId);
    const loteDivision = await Division.findByPk(selectedLote.idLoteamento);
    let contractInitDate = new Date(initDate.toString());
    let contractCreated = await Contract.create({
      loteId: loteId,
      divisionId: selectedLote.idLoteamento,
      corretageValue: `${numeroPorExtenso(selectedLote.taxPercentage)} por cento`,
      corretagePercent: selectedLote.taxPercentage,
      name: buyerName,
      email: buyerEmail,
      price: selectedLote.finalPrice,
      entryValue: entryValue,
      initDate: contractInitDate,
      parcelAmount: parcelsQuantity,
      sellerEmail,
      isOpened: true
    });


    const smtp = nodemailer.createTransport({
      host: 'smtp.umbler.com',
      port: 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // send an email to the buyer and seller with the contract link
    const buyerEmailResponse = await smtp.sendMail({
      from: process.env.EMAIL_USER,
      to: buyerEmail,
      subject: "Contrato de compra e venda",
      html: `<p>Olá ${buyerName},</p>
      <p>Segue o link para o contrato de compra e venda do lote ${selectedLote.name}, pertencente ao loteamento ${loteDivision.name}:</p>
      <p><a href="${urlToForm}">${urlToForm}</a></p>
      <p>Atenciosamente,</p>
      <p>Equipe BRIK Empreendimentos</p>`,
    });

    if(buyerEmailResponse){
      res.status(200).json({ message: "Contrato enviado com sucesso",  contractCreated});
    }else{
      res.status(500).json({ message: "Erro ao enviar o contrato" });
    }



    // const { name: buyerName, email: buyerEmail } = req.body.buyer
    // const { name: sellerName, email: sellerEmail } = req.body.seller
    // const { loteId } = req.body

    // const lote = await Lot.findByPk(loteId, {
    //   include: [
    //     {
    //       model: Partner,
    //       as: "lotePartners",
    //       required: false,
    //     },
    //   ],
    // });
    // await fetch(
    //   `https://sandbox.clicksign.com/api/v1/templates/${process.env.CS_CONTRACT_ID}/documents?access_token=${process.env.CS_ACESS_TOKEN}`,
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       "Accept": "application/json",
    //     },
    //     body: JSON.stringify({
    //       "document": {
    //         "path": "/Modelos/Modelo de contrato.docx",
    //         "template":{
    //           "data": {
    //             "nomeCliente": "Teste 3",
    //             "cpfCliente": "Teste 4",
    //             "rgCliente": "Teste 5",
    //             "enderecoCliente": "Teste 6",
    //             "nacionalidadeCliente": "Teste 7",
    //             "profissaoCliente": "Teste 8",
    //             "telefoneCliente": "Teste 9"
    //           }
    //         }
    //       }
    //     })
        
    //   } 
    // ) 
    //   .then((response) => response.json())
    //   .then((data) => {
    //     res.status(200).json({message: "Contrato enviado com sucesso", data});
    //   })
    //   .catch((err) => res.status(500).json({message: "Erro ao enviar contrato", err}));
  };

  static fillContract = async (req, res) => {
    try {
      // fill the contract with the data from the form
      const {
        loteId,
        name,
        email,
        cpf,
        rg,
        endereco,
        nacionalidade,
        profissao,
        telefone,
      } = req.body;
      
      const lote = await Lot.findByPk(loteId);
      const loteDivision = await Division.findByPk(lote.idLoteamento);
      let contract = await Contract.findOne({
        where: {
          loteId: loteId,
          isOpened: true,
        },
      })   
      
      await Contract.update({
        name,
        email,
        cpf,
        rg,
        endereco,
        nacionalidade,
        profissao,
        telefone,
        isOpened: false,
      }, { where: { id: contract.id } })  

      let contractFiller = await Contract.findByPk(contract.id) 
      // console.log('\x1b[36m%s\x1b[0m','contractFiller:', contractFiller)

        let saleYear = contractFiller.initDate.getFullYear(); 
        let saleMonth = String(contractFiller.initDate.getMonth() + 1).padStart(2, '0');
        let saleDay = String(contractFiller.initDate.getDate()).padStart(2, '0');
        const formattedSaleDate = `${saleYear}-${saleMonth}-${saleDay}`;
        const formatter = new Intl.NumberFormat('pt-br', { style: 'currency', currency: 'BRL' });
        const imovelPreco = formatter.format(lote.finalPrice);
        const imovelTaxValue = formatter.format((((lote.taxPercentage/10)*lote.finalPrice)));
        const saleCreation = await fetch('https://brik-backend.onrender.com/sales/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            "saleDate": formattedSaleDate,
            "salePrice": contractFiller.price,
            "entryValue": contractFiller.entryValue,
            "commission": 0,
            "discountPercentage": 0,
            "fixedTaxPercetage": contractFiller.corretagePercent,
            "variableTaxPercetage": 0,
            "contract": "",
            "loteId": contractFiller.loteId,
            "parcelsQuantity": contractFiller.parcelAmount,
          })
        });
        
        let saleSelected = await Sale.findOne({
          where: {
            loteId: contractFiller.loteId,
          },
          include: [
            {
              model: Parcel,
              as: "parcelas",
              required: true,
            },
          ],
        });
        // console.log('\x1b[36m%s\x1b[0m','saleSelected:', saleSelected)
        
        
        if (!saleSelected) {
          console.log("No sale found for the given loteId");
          // Add appropriate error handling or fallback logic here
        } else {
          // console.log("Sale found:", saleSelected);
          let updatedContract = await contract.update({
            parcelValue: saleSelected.parcelas[saleSelected.parcelas.length - 1].value,
          });
          // Rest of the code
        }
        

        const response = await fetch(
          `https://sandbox.clicksign.com/api/v1/templates/${process.env.CS_CONTRACT_ID}/documents?access_token=${process.env.CS_ACESS_TOKEN}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify({
              "document": {
                "path": "/Modelos/Modelo de contrato.docx",
                "template": {
                  "data": {
                    "pessoaFisica": "Pessoa Física",
                    "nomeCliente": contractFiller.name,
                    "cpfCliente": contractFiller.cpf,
                    "rgCliente": contractFiller.rg,
                    "enderecoCliente": contractFiller.endereco,
                    "nacionalidadeCliente": contractFiller.nacionalidade,
                    "profissaoCliente": contractFiller.profissao,
                    "telefoneCliente": contractFiller.telefone,
                    "loteamentoNome": loteDivision.name,
                    "loteamentoEndereco": loteDivision.location,
                    "imovelDesc": lote.description,
                    "imovelPreco": imovelPreco,
                    "loteMetragem": lote.metrics,
                    "valorCorretagem": imovelTaxValue,
                    "percentualCorretagem": `${lote.taxPercentage}% (${numeroPorExtenso(lote.taxPercentage)} por cento)`,
                    "loteMetragemExtenso": numeroPorExtenso(Number(lote.metrics)),
                    "quantidadeParcelas": contractFiller.parcelAmount,
                    "valorParcela": `
                    ${
                      saleSelected.parcelas.forEach((parcela) => {
                        let dateString = parcela.expireDate;
                        let date = new Date(dateString);
                
                        let formattedDate = date.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        });
                        return `${formatter.format(parcela.value)} para o dia ${formattedDate}`
                      }
                    )
                    }
                    
                    `,
                  }
                }
              }
            })
          }

        );

      const data = await response.json();
      
      await Contract.update(
        {
          documentKey: data.document.key,
        },
        {
          where: {
            loteId: contractFiller.loteId,
          },
        }
      );
      await Sale.update(
        {
          contract: data.document.key,
        },
        {
          where: {
            loteId: contractFiller.loteId,
          },
        }
      );
      console.log('\x1b[36m%s\x1b[0m','O socket deveria executar aqui')
      console.log('\x1b[36m%s\x1b[0m','---------------------------------')
      
      io.emit("notification", { message: "Nova notificação recebida" });
        
      console.log('\x1b[36m%s\x1b[0m','---------------------------------')
      res.status(200).json({ message: "Contrato preenchido com sucesso", data });
      
    } catch (err) {
      console.error("Error filling the contract:", err);
      res.status(500).json({ message: "Ocorreu um erro, entre em contato com o vendedor e tente novamente.", error: err.message });
      res.end();
    }
  };
  
  static contractFilledObserver = async (req, res) => {
    // Analisar quando um documento é preenchido
  };

  static getSalesOverview = async (req, res) => {
    // get the quantity of Lots, Divisions and Sales registered on database this month
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today - 30 * 24 * 60 * 60 * 1000);
      const sales = await Sale.findAll({
        attributes: [
          [Sequelize.fn("COUNT", Sequelize.col("id")), "salesQuantity"],
        ],
        where: {
          createdAt: {
            [Op.gte]: thirtyDaysAgo,
            [Op.lt]: today,
          },
        },
        raw: true,
      });
      const lots = await Lot.findAll({
        attributes: [
          [Sequelize.fn("COUNT", Sequelize.col("id")), "lotsQuantity"],
        ],
        where: {
          createdAt: {
            [Op.gte]: thirtyDaysAgo,
            [Op.lt]: today,
          },
        },
        raw: true,
      });
      const divisions = await Division.findAll({
        attributes: [
          [Sequelize.fn("COUNT", Sequelize.col("id")), "divisionsQuantity"],
        ],
        where: {
          createdAt: {
            [Op.gte]: thirtyDaysAgo,
            [Op.lt]: today,
          },
        },
        raw: true,
      });
      res
        .status(200)
        .json({ sales: sales[0], lots: lots[0], divisions: divisions[0] });
    } catch (error) {
      res.status(500).json({
        message: "Ocorreu um erro ao processar a requisição",
        error,
      });
    }
  };

  static getClickSignUpdates = async (req, res) => {
    // POST /api/v1/documents?access_token= HTTP/1.1
    // Host: sandbox.clicksign.com
    // Content-Type: application/json
    // Accept: application/json

    console.log("getClickSignUpdates");
  };
}

/* 
  static sentContractEmail = async (req, res) => {
    let {seller, buyer, lotData} = req.body
    const smtp = nodemailer.createTransport({
      host: 'smtp.umbler.com',
      port: 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let mailList = [seller.email, buyer.email, process.env.EMAIL_USER]

      let entryPercentage = (numeroPorExtenso((((lotData.entryValue / lotData.lotPrice) * 100))))
      let entryPercentageFormatted = `${(lotData.entryValue / lotData.lotPrice) * 100}% ( ${entryPercentage} )`
      let lotMetricsFormatted = `${lotData.lotArea}m² ( ${numeroPorExtenso(lotData.lotArea)} )`
      const months = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
      ];
      let today = new Date();
      let day = today.getDate().toString().padStart(2, '0');
      let month = (today.getMonth() + 1).toString().padStart(2, '0');
      let year = today.getFullYear().toString();
      let formattedDate = `Registro, ${day} de ${months[parseInt(month) - 1]} de ${year}`;
      const baseUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSd4VOfWgJmPD-MPcLhFPF8lJCmJ1_f12K7Ot_M5HN76nZ5AGA/viewform';
      const params = [
        `entry.566285923=${lotData.divisionName}`,
        `entry.1871930894=${lotData.lotName}`,
        `entry.764727872=${lotData.divisionLocation}`,
        `entry.1300828265=${lotMetricsFormatted}`,
        `entry.1425417167=${formattedDate}`,
        `entry.1576756638=${lotData.lotPrice}`,
        `entry.1046238257=${lotData.entryValue}`,
        `entry.284115857=${entryPercentageFormatted}`
      ];
      const formUrl = `${baseUrl}?${params.map(param => encodeURIComponent(param)).join('&')}`;
      smtp.sendMail({
      from: process.env.EMAIL_USER,
      to:  mailList,
      replyTo: process.env.EMAIL_USER,
      subject: '[BRIK] Formulário de compra',
      html: `<!DOCTYPE html>
      <html>
      <head>
      </head>
      <body style="background-color: #f1f1f1 !important; margin: 0; padding: 0;">
      <style>
        a:hover {
          text-decoration: none;
          color: #fff;
        }
      </style>
          <div class="card" style="background-color: #fff !important; width: 100%; padding: 20px; box-sizing: border-box; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 30px;">
              <img src="https://i.imgur.com/loaEjtY.png" alt="Logo BRIK" class="logo" style="width: 150px; margin-bottom: 30px;">
              <div class="title" style="width: 100%; text-align: center; font-size: 24px; font-weight: bold;">Olá ${buyer.name}</div>
              <div class="subtitle" style="width: 80%; font-size: 18px; margin-top: 10px; margin-bottom: 20px; font-weight: 300;">Clique no link abaixo para preencher o formulário com as informações para a formalização do contrato referente ao processo de compra do lote "${lotData.lotName}", pertencente ao loteamento "${lotData.divisionName}"</div>
              <a href="${formUrl}" class="button" style="background-color: #63C600; margin-bottom: 50px; color: white; padding: 20px 50px; text-decoration: none; font-size: 24px; font-weight: bold; display: inline-block; cursor: pointer;">Preencher formulário</a>
          </div>
      </body>
      </html>
      `
    }).then((info) => {
      res.status(200).json({message: 'Formulário enviado com sucesso', info})
    }).catch((error) => {
      res.status(500).json({message: 'Erro ao enviar email cliente', error})
    })
  };

*/

module.exports = salesController;
