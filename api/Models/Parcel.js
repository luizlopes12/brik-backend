const db = require('../config/database.js')
const Sale = require('./Sale.js')

const Parcel = db.connection.define('Parcelas', {
    expireDate: {
        type: db.Sequelize.DATE,
        required: true
    },
    value: {
        type: db.Sequelize.REAL,
        required: true
    },
    status: {
        type: db.Sequelize.STRING,
        defaultValue: false
    },
    mulct: {
        type: db.Sequelize.REAL,
        required: false
    },
    billetLink: {
        type: db.Sequelize.STRING,
        required: false
    },
    billetPdf: {
        type: db.Sequelize.STRING,
        required: false
    },
    chargeId: {
        type: db.Sequelize.INTEGER,
        required: true
    },
});


Sale.hasMany(Parcel, {as: 'parcelas', foreignKey: 'saleId'});
Parcel.belongsTo(Sale, {as: 'vendas', foreignKey: 'saleId'});

// Sale.sync({ force: true }).then(() => {
//     Parcel.sync({ force: true }) 
// })

module.exports = Parcel

