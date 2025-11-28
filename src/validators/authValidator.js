const jwt = require('jsonwebtoken');
const ApiError = require('../error/api.error');
const tokenService = require('../domain/token/token.service');

function authValidator(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return next(ApiError.unauthorized());
    }

    if (!tokenService.validateAccessToken(token)) {
        return next(ApiError.unauthorized());
    }

    next();
}

module.exports = authValidator;