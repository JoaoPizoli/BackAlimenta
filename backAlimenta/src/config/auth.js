module.exports = {
    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-key-change-in-production',
        expiresIn: '1d'
    }
};
