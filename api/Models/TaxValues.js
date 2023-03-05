const db = require('../config/database.js')


const TaxValues = db.connection.define('juros', {
    defaultTax: {
        type: db.Sequelize.DECIMAL(10, 2),
        defaultValue: 1
    },
    after24Months: {
        type: db.Sequelize.DECIMAL(10, 2),
        defaultValue: 1
    },
});

// TaxValues.sync({ force: true })

module.exports = TaxValues

// TaxValues.create({
//     defaultTax: 1,
//     after24Months: 1,
// })
