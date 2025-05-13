const jwt = require('jsonwebtoken');

class TokenService {
    generateTokens(payload) {
        return {
            refreshToken: jwt.sign(payload, process.env.REFRESH_SECRET_KEY, {expiresIn: '30d'}),
            accessToken: jwt.sign(payload, process.env.ACCESS_SECRET_KEY, {expiresIn: '30m'}),
        };
    }
}

module.exports = new TokenService();