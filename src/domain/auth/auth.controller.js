const {validationResult} = require('express-validator');
const ApiError = require('../../error/api.error');
const isImage = require('./validators/isImage');
const authService = require('./auth.service');

const cookieOptions = {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true
};

class AuthController {
    async registration(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(ApiError.badRequest('data is invalid', errors.array()));
            }

            const {name, surname, email, password} = req.body;
            const files = req.files;

            if (files?.image) {
                if (!isImage(files?.image.name)) {
                    return next(ApiError.badRequest('Image Error'));
                }
            }

            const data = await authService.registration(name, surname, email, password, files?.image);
            res.cookie('refreshToken', data.refreshToken, cookieOptions);
            res.json(data);
        } catch (e) {
            next(e);
        }
    }

    async login(req, res, next) {
        try {
            const {email, password} = req.body;
            const data = await authService.login(email, password);
            res.cookie('refreshToken', data.refreshToken, cookieOptions);
            res.json(data);
        } catch (e) {
            next(e);
        }
    }

    async logout(req, res, next) {
        try {
            const refreshToken = req.cookies;
            await authService.logout(refreshToken);
            res.clearCookie('refreshToken');
            res.json('OK');
        } catch (e) {
            next(e);
        }
    }

    async activate(req, res, next) {
        try {
            const {link} = req.params;
            await authService.activate(link);
            res.redirect(process.env.CLIENT_URL);
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new AuthController();