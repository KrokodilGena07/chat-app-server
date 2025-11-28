const userService = require('./users.service');

class UsersController {
    async findMany(req, res, next) {
        try {
            const {search} = req.query;
            const data = await userService.findMany(search);
            res.json(data);
        } catch (e) {
            next(e);
        }
    }

    async getOne(req, res, next) {
        try {
            const {id} = req.params;
            const data = await userService.getOne(id);
            res.json(data);
        } catch (e) {
            next(e);
        }
    }

    async getMany(req, res, next) {
        try {
            const {list} = req.query;

            console.log(list);
            const data = await userService.getMany(list);
            res.json(data);
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new UsersController();