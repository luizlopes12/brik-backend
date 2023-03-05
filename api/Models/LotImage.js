const db = require('../config/database.js')
const Lot = require('./Lot')

const LotImage = db.connection.define('LoteImages', {
    imageUrl: {
        type: db.Sequelize.STRING,
        required: true,
        defaultValue: 'https://i.imgur.com/8CiJy7t.png'
    }
})

// LotImage.belongsTo(Lot, {
//     constraint: true,
//     foreignKey: 'idLote'
// })
Lot.hasMany(LotImage, {as: 'loteImages', foreignKey: 'idLote', onDelete: 'cascade', hooks: true})

module.exports = LotImage

// LotImage.sync({force: true})

// LotImage.create({
//     imageUrl: 'https://i.imgur.com/Urn.png',
//     idLote: 2
// })