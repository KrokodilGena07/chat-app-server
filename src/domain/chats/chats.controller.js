const chatsService = require('./chats.service');

class ChatsController {
    async getMany(req, res, next) {
        try {
            const {userId} = req.params;
            const data = await chatsService.getMany(userId);
            res.json(data);
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new ChatsController();