const express = require('express');
const authRouter = require('../domain/auth/auth.router');
const chatsRouter = require('../domain/chats/chats.router');
const usersRouter = require('../domain/users/users.router');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/chats', chatsRouter);
router.use('/users', usersRouter);

module.exports = router;