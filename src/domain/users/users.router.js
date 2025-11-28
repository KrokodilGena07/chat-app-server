const express = require('express');
const usersController = require('./users.controller');
const authValidator = require('../../validators/authValidator');

const usersRouter = express.Router();

usersRouter.get('/search', authValidator, usersController.findMany);
usersRouter.get('/one/:id', authValidator, usersController.getOne);
usersRouter.get('/many', authValidator, usersController.getMany);

module.exports = usersRouter;