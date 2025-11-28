const {Chat, User, Message, ChatUser} = require('../../models');
const {Op} = require('sequelize');
const sequelize = require('sequelize');

class ChatsService {
    async getMany(userId) {
        return await ChatUser.findAll({
            where: {userId},
            include: [
                {
                    model: Chat,
                    include: {
                        model: Message,
                        order: [['date', 'DESC']],
                        limit: 1,
                        attributes: ['text', 'date']
                    }
                },
                {
                    model: Chat,
                    include: {
                        model: ChatUser,
                        where: {
                            userId: {[Op.ne]: userId}
                        },
                        include: {
                            model: User,
                            attributes: ['name', 'surname', 'image']
                        }
                    }
                }
            ]
        });

        // const ids = [];
        // const chatIds = [];
        // const usersObj = {};
        // const messagesObj = {};

        // chats.forEach(chat => {
        //     if (chat.type === 'CHAT') {
        //         const id = JSON.parse(chat.users).filter(id => id !== userId)[0];
        //         ids.push(id);
        //         chatIds.push(chat.id);
        //     }
        // });

        // const users = await User.findAll({
        //     where: {
        //         id: ids
        //     },
        //     attributes: ['id', 'name', 'surname', 'image']
        // });

        // const messages = await Message.findAll({
        //     where: {
        //         date: {
        //             [Op.in]: sequelize.literal(
        //                 `(SELECT MAX(date) FROM messages GROUP BY "chatId")`
        //             )
        //         },
        //         chatId: chatIds
        //     }
        // });

        // messages.forEach(message => {
        //     messagesObj[message.chatId] = message.dataValues;
        // });
        //
        // users.forEach(user => {
        //     usersObj[user.id] = user.dataValues;
        // });

        // chats.forEach(chat => {
        //     if (chat.type === 'CHAT') {
        //         const id = JSON.parse(chat.users).filter(id => id !== userId)[0];
        //         chat.dataValues.user = usersObj[id];
        //         chat.dataValues.users = JSON.parse(chat.dataValues.users);
        //         chat.dataValues.lastMessage = messagesObj[chat.id];
        //     }
        // });

        // return chats;
    }
}

module.exports = new ChatsService();