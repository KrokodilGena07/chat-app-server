const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, '..', `.${process.env.NODE_ENV}.env`)});
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const compressionMiddleware = require('./middlewares/compression.middleware');
const router = require('./router');
const errorMiddleware = require('./middlewares/error.middleware');
const db = require('./config/db');
require('./models/index');
const WebSocket = require('ws');
const fileUpload = require('express-fileupload');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const {Chat, Message} = require('./models');

const PORT = process.env.PORT;
const app = express();

app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    maxAge: 86400,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression({
    filter: compressionMiddleware
}));
app.use(cookieParser());
app.use(express.json());
app.use(fileUpload({}));
app.use('/static/images', express.static(process.env.IMAGES_FOLDER));
app.use('/api', router);
app.use(errorMiddleware);

const wss = new WebSocket.WebSocketServer({
    port: process.env.WS_PORT
});

const userSockets = new Map();

wss.on('connection', (ws, req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        ws.close(1003, 'unauthorized error');
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.ACCESS_SECRET_KEY);
    } catch (e) {
        ws.close(1003, 'unauthorized error');
    }

    userSockets.set(decoded.id, ws);

    ws.on('message', async message => {
        await handleMessage(message, ws);
    });

    ws.on('close', () => {
        userSockets.delete(decoded.id);
    });
});

async function handleMessage(message, ws) {
    const msg = JSON.parse(message);
    switch (msg.type) {
        case 'CREATE_CHAT':
            await createChat(msg.data);
            break;
        case 'SEND_MESSAGE':
            await sendMessage(msg.data);
            break;
        case 'LOAD_MESSAGES':
            await loadMessages(msg.data);
            break;
        default: ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
}

async function createChat(data) {
    const id = uuid.v4();
    await Chat.create({id, users: JSON.stringify(data.users)});
}

async function loadMessages(data) {
    const id = data.chatId;
    const messages = await Message.findAll({where: {chatId: id}});
    const userSocket = userSockets.get(data.userId);
    if (userSocket && userSocket.readyState === WebSocket.OPEN) {
        userSocket.send(JSON.stringify(messages));
    }
}

async function sendMessage(data) {
    if (!data.chatId) {
        const chatId = uuid.v4();
        const messageId = uuid.v4();
        const senderId = data.senderId;
        const recipientId = data.recipientId;

        await Chat.create({
            id: chatId,
            users: JSON.stringify([senderId, recipientId])
        });
        const message = await Message.create({
            id: messageId,
            text: data.text,
            senderId,
            chatId
        });

        const senderSocket = userSockets.get(senderId);
        const recipientSocket = userSockets.get(recipientId);

        if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
            senderSocket.send(JSON.stringify(message));
        }

        if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
            recipientSocket.send(JSON.stringify(message));
        }

        return;
    }

    const chat = await Chat.findByPk(data.chatId);
    if (!chat) {
        console.log('Error');
    }

    const users = JSON.parse(chat.users);

    const id = uuid.v4();
    const message = await Message.create({
        id,
        text: data.text,
        senderId: data.senderId,
        chatId: data.chatId
    });

    for (const userId of users) {
        const userSocket = userSockets.get(userId);
        if (userSocket && userSocket.readyState === WebSocket.OPEN) {
            userSocket.send(JSON.stringify(message));
        }
    }
}

async function start() {
    try {
        await db.authenticate();
        await db.sync();
        app.listen(PORT, () => console.log(`Server started on PORT ${PORT}`));
    } catch (e) {
        console.log(e);
    }
}

start().then();