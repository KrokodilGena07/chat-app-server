const jwt = require('jsonwebtoken');
const {Session} = require('../../models');
const uuid = require('uuid');

class TokenService {
    generateTokens(payload) {
        return {
            refreshToken: jwt.sign(payload, process.env.REFRESH_SECRET_KEY, {expiresIn: '30d'}),
            accessToken: jwt.sign(payload, process.env.ACCESS_SECRET_KEY, {expiresIn: '30m'}),
        };
    }

    async saveToken(refreshToken, userId, userAgent) {
        const token = await Session.findOne({where: {userAgent, userId}});
        if (!token) {
            const id = uuid.v4();
            return Session.create({id, refreshToken, userId, userAgent})
        }
        token.refreshToken = refreshToken;
        await token.save();
    }

    validateAccessToken(token) {
        try {
            return jwt.verify(token, process.env.ACCESS_SECRET_KEY);
        } catch (e) {
            return null;
        }
    }

    validateRefreshToken(token) {
        try {
            return jwt.verify(token, process.env.REFRESH_SECRET_KEY);
        } catch (e) {
            return null;
        }
    }
}

module.exports = new TokenService();