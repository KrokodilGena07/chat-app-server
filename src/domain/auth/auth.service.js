const path = require('path');
const uuid = require('uuid');
const ApiError = require('../../error/api.error');
const {User, Session} = require('../../models');
const bcrypt = require('bcrypt');
const mailService = require('../mail/mail.service');
const tokenService = require('../token/token.service');
const UserDto = require('../../dtos/user.dto');

class AuthService {
    async registration(name, surname, email, password, image, userAgent) {
        const candidate = await User.findOne({where: {email}});
        if (candidate) {
            throw ApiError.badRequest('user with this id already exists');
        }

        const newUser = {name, email};

        if (surname) {
            newUser.surname = surname;
        }

        if (image) {
            const ext = path.extname(image.name);
            const filename = uuid.v4() + ext;

            try {
                image.mv(path.join(process.env.IMAGES_FOLDER, filename));
            } catch (e) {
                throw ApiError.badRequest('Image Error');
            }

            newUser.image = `${process.env.API_URL}/static/images/${filename}`;
        }

        const hashPassword = await bcrypt.hash(password, 5);
        const activationLink = uuid.v4();
        const id = uuid.v4();

        newUser.password = hashPassword;
        newUser.activationLink = activationLink;
        newUser.id = id;

        const user = await User.create(newUser);
        // await mailService.sendMail(
        //     email,
        //     `${process.env.API_URL}/api/auth/activate/${activationLink}`
        // );

        return await this.#finishAuth(user, userAgent);
    }

    async login(email, password, userAgent) {
        if (!email || !password) {
            throw ApiError.badRequest('data is empty');
        }

        const user = await User.findOne({where: {email}});
        if (!user) {
            throw ApiError.badRequest('user wasn\'t found');
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            throw ApiError.badRequest('password is wrong');
        }

        return await this.#finishAuth(user, userAgent);
    }

    async logout(refreshToken) {
        const session = await Session.findOne({where: {refreshToken}});
        if (!session) {
            throw ApiError.badRequest('Logout error');
        }

        await session.destroy();
    }

    async activate(link) {
        const user = await User.findOne({where: {activationLink: link}});
        if (!user) {
            throw ApiError.badRequest('link is wrong');
        }

        user.isActivated = true;
        return await user.save();
    }

    async refresh(refreshToken) {
        if (!refreshToken) {
            throw ApiError.unauthorized();
        }

        const decoded = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDB = await Session.findOne({where: {refreshToken}});

        if (!decoded || !tokenFromDB) {
            throw ApiError.unauthorized();
        }

        const user = await User.findByPk(decoded.id);
        if (!user) {
            throw ApiError.unauthorized();
        }

        return this.#finishAuth(user);
    }

    async #finishAuth(user, userAgent) {
        const tokens = tokenService.generateTokens({
            id: user.id, email: user.email
        });
        await tokenService.saveToken(tokens.refreshToken, user.id, userAgent);
        const userDto = new UserDto(user);
        return {...tokens, user: userDto};
    }
}

module.exports = new AuthService();