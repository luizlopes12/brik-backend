const db = require('../config/database.js')

const Contract = db.connection.define('Contratos', {
    price: {
        type: db.Sequelize.FLOAT,
    },
    documentKey: {
        type: db.Sequelize.STRING,
    },

    loteId: {
        type: db.Sequelize.INTEGER,
    },
    divisionId: {
        type: db.Sequelize.INTEGER,
    },
    corretageValue: {
        type: db.Sequelize.STRING,
    },
    corretagePercent: {
        type: db.Sequelize.FLOAT,
    },
    name: {
        type: db.Sequelize.STRING,
    },
    email: {
        type: db.Sequelize.STRING,
    },
    sellerEmail: {
        type: db.Sequelize.STRING,
    },
    cpf: {
        type: db.Sequelize.STRING,
    },
    rg: {
        type: db.Sequelize.STRING,
    },
    endereco: {
        type: db.Sequelize.STRING,
    },
    nacionalidade: {
        type: db.Sequelize.STRING,
    },
    profissao: {
        type: db.Sequelize.STRING,
    },
    telefone: {
        type: db.Sequelize.STRING,
    },

    parcelAmount: {
        type: db.Sequelize.INTEGER,
    },
    parcelValue: {
        type: db.Sequelize.FLOAT,
    },
    initDate: {
        type: db.Sequelize.STRING,
    },
    isOpened: {
        type: db.Sequelize.BOOLEAN,
    },
    isSigned: {
        type: db.Sequelize.BOOLEAN,
    },
    isCanceled: {
        type: db.Sequelize.BOOLEAN,
    },
})


module.exports = Contract

// Contract.sync({force: true});

// Banner.create({
//     name: 'Teste',
//     link: 'www.github.com/luizlopes12',
//     imageUrl: 'www.github.com/luizlopes12.png'
// })