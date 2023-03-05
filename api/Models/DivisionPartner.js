const db = require('../config/database.js')
const Division = require('./Division.js')

const DivisionPartner = db.connection.define('DivisionPartners', {
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

Division.hasMany(DivisionPartner, {as: 'divisionPartners', foreignKey: 'idLoteamento', onDelete: 'cascade', hooks: true})


module.exports = DivisionPartner

// DivisionPartner.sync({force: true})

// DivisionPartner.create({
//     name: 'Berreca',
//     CPF: '444444444444',
//     percentage: 5.5,
//     idLoteamento: 2
// })