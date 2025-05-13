const express = require('express');
const authValidator = require('./validators/authValidator');
const authController = require('./auth.controller');

const authRouter = express.Router();

authRouter.post('/registration', ...authValidator, authController.registration);
authRouter.post('/login', authController.login);
authRouter.post('/logout', authController.logout);
authRouter.get('/activate/:link', authController.activate);

module.exports = authRouter;