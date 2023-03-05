const db = require('../config/database.js')
const Lot = require('./Lot')
const Division = require('./Division')
const User = require('./User')

const Sale = db.connection.define('Vendas', {
    saleDate: {
        type: db.Sequelize.DATE,
        allowNull: false
    },
    status: {
        type: db.Sequelize.STRING,
        defaultValue: 'Aguardando',
        allowNull: false
    },
    salePrice: {
        type: db.Sequelize.REAL,
        allowNull: false
    },
    commission: {
        type: db.Sequelize.REAL,
        allowNull: false
    },
    fixedTaxPercetage: {
        type: db.Sequelize.REAL,
        defaultValue: 1
    },
    variableTaxPercetage: {
        type: db.Sequelize.REAL,
        defaultValue: 1
    },
    contract: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    entryValue: {
        type: db.Sequelize.REAL,
        allowNull: false,
        defaultValue: 0
    },
    parcelsQuantity: {
        type: db.Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    discountPercentage: {
        type: db.Sequelize.REAL,
        allowNull: false,
        defaultValue: 0
    },
});

Sale.belongsTo(Lot, { as: 'lotes', foreignKey: 'loteId', hooks: true });
Sale.belongsTo(User, { as: 'users', foreignKey: 'buyerId', hooks: true });


// Sale.sync({ force: true })

module.exports = Sale

