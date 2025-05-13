const {body} = require('express-validator');

const authValidator = [
    body('name', 'max length is 255').isLength({min: 1, max: 255}),
    body('surname', 'max length is 255').optional().isLength({min: 1, max: 255}),
    body('email', 'email is invalid').isEmail(),
    body('password', 'password is weak').isStrongPassword({
        minLength: 10,
        minSymbols: 1,
        minNumbers: 2,
        minUppercase: 2,
        minLowercase: 2
    })
];

module.exports = authValidator;