const db = require('../config/database.js')
const Division = require('./Division')

const Lot = db.connection.define('Lotes', {
    name: {
        type: db.Sequelize.STRING,
        required: true
    },
    lotType: {
        type: db.Sequelize.STRING,
        required: false,
        defaultValue: 'Urbano',
    },
    location: {
        type: db.Sequelize.STRING,
        required: true,
    },
    metrics: {
        type: db.Sequelize.STRING,
        required: true,
    },
    basePrice: {
        type: db.Sequelize.STRING,
        required: false,
    },
    finalPrice: {
        type: db.Sequelize.STRING,
        required: false,
    },
    hiddenPrice: {
        type: db.Sequelize.BOOLEAN,
        defaultValue: false
    },
    taxPercentage: {
        type: db.Sequelize.STRING,
        required: false,
    },
    taxPercentage24: {
        type: db.Sequelize.STRING,
        required: false,
    },
    maxPortionsQuantity: {
        type: db.Sequelize.REAL,
        required: false,
    },
    description: {
        type: db.Sequelize.STRING,
        required: false,
    },
    isAvaible:{
        type: db.Sequelize.STRING,
        required: false,
        defaultValue: 'avaible',
    },
    isSolded: {
        type: db.Sequelize.BOOLEAN,
        defaultValue: false
    },
    userViews: {
        type: db.Sequelize.INTEGER,
        defaultValue: 0,
    },
    lotDescription: {
        type: db.Sequelize.TEXT('long'),
        required: false,
    },

})

Division.hasMany(Lot, {as: 'lotes', foreignKey: 'idLoteamento', onDelete: 'cascade', hooks: true})
 
module.exports = Lot

// Lot.sync({force: true})

// Lot.create({
//     name: 'TestBBBBe',
//     location: 'AAAA',
//     metrics: '25m',
//     idLoteamento: 1
// })