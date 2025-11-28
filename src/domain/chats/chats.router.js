const express = require('express');
const authValidator = require('../../validators/authValidator');
const chatsController = require('./chats.controller');

const chatsRouter = express.Router();

chatsRouter.get('/:userId', chatsController.getMany); // TODO ADD AUTH CHECK

module.exports = chatsRouter;