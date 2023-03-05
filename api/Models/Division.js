const db = require('../config/database.js')

const Division = db.connection.define('loteamentos', {
    name: {
        type: db.Sequelize.STRING,
        required: true
    },
    logoUrl: {
        type: db.Sequelize.STRING,
        required: false,
        defaultValue: 'https://i.imgur.com/YQOzMWA.png',
    },
    location: {
        type: db.Sequelize.STRING,
        required: true,
    },
    lotsQuantity: {
        type: db.Sequelize.INTEGER,
        required: false,
    },
    bluePrint:{
        type: db.Sequelize.STRING,
        required: false,
    }
})


module.exports = Division

// Division.sync({force: true});

