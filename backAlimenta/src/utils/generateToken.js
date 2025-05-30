const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

module.exports = function generateToken(params = {}) {
    return jwt.sign(params, authConfig.jwt.secret, {
        expiresIn: authConfig.jwt.expiresIn,
    });
};
