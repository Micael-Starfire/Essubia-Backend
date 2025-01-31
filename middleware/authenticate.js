const jwt = require('jsonwebtoken');

async function authenticate (req, res, next) {
    try {
        const jwtToken = req.header("jwtToken");

        if (!jwtToken) {
            // No token, invalid - send error
            return res.status(403).json({error: 'Unauthorized'});
        }

        const payload = jwt.verify(jwtToken, process.env.JWT_SECRET);
        req.user = payload.user;
        next();
    } catch (error) {
        console.error(error.message);
        return res.status(403).json({error: 'Unauthorized'});
    }
}

module.exports = authenticate;