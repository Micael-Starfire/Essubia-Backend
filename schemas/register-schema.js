const {body, check} = require('express-validator');

const registerSchema = [
    check('username')
        .trim()
        .isAlphanumeric('en-US', {ignore:'-_'})
        .withMessage('Username may only include letters, numbers, dash, or underscore')
        .isLength({min:4, max:30})
        .withMessage('Username must be between 4 and 30 characters')
        .escape(),
    check('email')
        .trim()
        .isLength({max:150})
        .withMessage('Email address is too long')
        .notEmpty()
        .withMessage('Must include email address')
        .isEmail()
        .withMessage('Email is invalid')
        .normalizeEmail(),
    check('password')
        .trim()
        .isLength({min:8})
        .withMessage('Password must be at least 8 characters long')
        .isLength({max:250})
        .withMessage('Password is too long (more than 250 characters)'),
    check('invitecode')
        .trim()
        .isLength({max:30})
        .withMessage('Invalid invite code')
]

module.exports = registerSchema;