const db = require('../config/database.js')
const User = require('./User.js')

const Notification = db.connection.define('Notifications', {
    title: {
        type: db.Sequelize.STRING,
        required: true
    },
    description: {
        type: db.Sequelize.STRING,
        required: true
    },
    actionLink: {
        type: db.Sequelize.STRING,
        required: false
    },
    opened: {
        type: db.Sequelize.BOOLEAN,
        required: true,
        defaultValue: false
    }
})

User.hasMany(Notification, { as: 'usuarios', foreignKey: 'notificationUserId', onDelete: 'cascade', hooks: true });
Notification.belongsTo(User, { as: 'usuarios', foreignKey: 'notificationUserId', onDelete: 'cascade', hooks: true});

// Notification.sync({ force: true })

module.exports = Notification

// Notification.create({
//     title: 'Teste2',
//     description: 'Teste2',
//     actionLink: 'Teste2',
//     notificationUserId: 29
// })

