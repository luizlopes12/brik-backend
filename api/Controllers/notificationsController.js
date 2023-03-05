const Notification = require('../Models/Notification')
const User = require('../Models/User')


class notificationsController {
    static listAllNotifications = async (req, res) => {
        const notifications = await Notification.findAll({
            where: {
                notificationUserId: req.userID
            },
            attributes: ['id', 'title', 'description', 'actionLink', 'createdAt'],
            include: [
                {
                    model: User,
                    as: 'usuarios',
                    required: true,
                    attributes: []
                }
            ],
            order: [ ['createdAt', 'DESC'] ]
        });
        if (notifications.length === 0) {
            return res.status(404).json({ message: 'Nenhuma notificação encontrada' })
        }
        if (!notifications) {
            return res.status(500).json({ message: 'Erro no servidor' })
        }
        return res.status(200).json(notifications);
    }
}

module.exports = notificationsController