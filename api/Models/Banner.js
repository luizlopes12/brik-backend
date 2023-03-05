const db = require('../config/database.js')

const Banner = db.connection.define('Banners', {
    name: {
        type: db.Sequelize.STRING,
        required: true
    },
    link: {
        type: db.Sequelize.STRING,
        required: false,
    },
    imageUrl: {
        type: db.Sequelize.STRING,
        required: true,
    },
    initDate: {
        type: db.Sequelize.DATE,
    },
    expireDate: {
        type: db.Sequelize.DATE,
    }
})


module.exports = Banner

// Banner.sync({force: true});

// Banner.create({
//     name: 'Teste',
//     link: 'www.github.com/luizlopes12',
//     imageUrl: 'www.github.com/luizlopes12.png'
// })