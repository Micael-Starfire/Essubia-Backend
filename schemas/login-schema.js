const {body, check, oneOf} = require('express-validator');

const loginSchema = [
    oneOf([
        check('login')
            .trim()
            .isAlphanumeric('en-US', {ignore: '-_'})
            .isLength({min:4, max:30})
            .escape(),
        check('login')
            .trim()
            .isEmail()
            .normalizeEmail()
        ],
        {message: 'Login or Password is incorrect'}
    ),
    check('password')
        .trim()
        .notEmpty()
        .withMessage('No password')
]

module.exports = loginSchema;