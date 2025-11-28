const {validationResult} = require('express-validator');
const ApiError = require('../../error/api.error');
const isImage = require('./validators/isImage');
const authService = require('./auth.service');

const cookieOptions = {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    secure: true
};

class AuthController {
    async registration(req, res, next) {
        try {
            const userAgent = req.headers['user-agent'];

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

            const data = await authService.registration(name, surname, email, password, files?.image, userAgent);
            res.cookie('refreshToken', data.refreshToken, cookieOptions);
            res.json(data);
        } catch (e) {
            next(e);
        }
    }

    async login(req, res, next) {
        try {
            const {email, password} = req.body;
            const userAgent = req.headers['user-agent'];
            const data = await authService.login(email, password, userAgent);
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

    async refresh(req, res, next) {
        try {
            const {refreshToken} = req.cookies;
            const data = await authService.refresh(refreshToken);
            res.cookie('refreshToken', data.refreshToken, cookieOptions);
            res.json(data);
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new AuthController();