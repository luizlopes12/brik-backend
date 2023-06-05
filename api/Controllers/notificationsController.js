const Notification = require('../Models/Notification')
const User = require('../Models/User')


class notificationsController {
    static createNotification = async (req, res) => {
        const { title, description, actionLink } = req.body;
        if (!title || !description) {
            return res.status(400).json({ message: 'Dados inválidos' })
        }
        const notification = await Notification.create({
            title,
            description,
            actionLink,
        })
        if (!notification) {
            return res.status(500).json({ message: 'Erro no servidor' })
        }
        return res.status(200).json({ message: 'Notificação criada com sucesso' })
    }

    static listAllNotifications = async (req, res) => {
        const notifications = await Notification.findAll({
            attributes: ['id', 'title', 'description', 'actionLink', 'opened', 'createdAt'],
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
    static visualizeNotification = async (req, res) => {
        Notification.update({ opened: true }, {
            where: {
                id: req.params.id,
            }
        }).then(() => {
        res.status(200).json({ message: 'Notificação visualizada' })
        }).catch((err) => {
            res.status(500).json({ message: 'Erro no servidor' })
        }
        )
    }
}

module.exports = notificationsController