const db = require('../config/database.js')
const Lot = require('./Lot')

const Partner = db.connection.define('Partners', {
    name: {
        type: db.Sequelize.STRING,
        required: true,
    },
    CPF: {
        type: db.Sequelize.STRING,
        required: true,
    },
    percentage: {
        type: db.Sequelize.REAL,
        required: true,
    },
})

Lot.hasMany(Partner, {as: 'lotePartners', foreignKey: 'idLote', onDelete: 'cascade', hooks: true})


module.exports = Partner

// Partner.sync({force: true})

// Partner.create({
//     name: 'Berreca',
//     CPF: '444444444444',
//     percentage: 5.5,
//     idLote: 2
// })