const express = require('express');
const authRouter = require('../domain/auth/auth.router');

const router = express.Router();

router.use('/auth', authRouter);

module.exports = router;