const { validationResult } = require('express-validator');

function validate (req, res, next) {
    const errorList = validationResult(req);

    if (!errorList.isEmpty()) {
        return res.status(400).json({error: errorList.errors[0].msg});
    }

    next();
}

module.exports = validate;
