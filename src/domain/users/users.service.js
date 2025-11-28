const {User} = require('../../models');
const {Op} = require('sequelize');
const UserDto = require('../../dtos/user.dto');
const ApiError = require('../../error/api.error');

class UsersService {
    async findMany(search) {
        const users = await User.findAll({where: {
            [Op.or]: {
                name: {
                    [Op.iLike]: `%${search}%`
                },
                surname: {
                    [Op.iLike]: `%${search}%`
                }
            }
        }});

        return users.map(user => new UserDto(user));
    }

    async getOne(id) {
        const user = await User.findByPk(id);
        return new UserDto(user);
    }

    async getMany(list) {
        let ids;
        try {
            ids = JSON.parse(list);
        } catch (e) {
            throw ApiError.badRequest('list is invalid');
        }

        if (!Array.isArray(ids)) {
            throw ApiError.badRequest('data is invalid');
        }

        const users = await User.findAll({
            where: {
                id: {
                    [Op.in]: ids
                }
            }
        });
        return users.map(user => new UserDto(user));
    }
}

module.exports = new UsersService();