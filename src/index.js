require('dotenv').config();
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
const {Chat, Message, ChatUser, User} = require('./models');
const url = require('url');
const {Op} = require('sequelize');

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
app.use('/static/images', express.static(process.env.IMAGES_FOLDER, {
    setHeaders: (res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    },
}));
app.use('/api', router);
app.use(errorMiddleware);

const server = app.listen(PORT, () => console.log(`Server started on PORT ${PORT}`));

const wss = new WebSocket.WebSocketServer({
    server
});

const userSockets = new Map();

wss.on('connection', (ws, req) => {
    const parsedUrl = url.parse(req.url, true);
    const token = parsedUrl.query.token;

    if (!token) {
        return ws.close(1003, 'unauthorized error');
    }
    let decoded;
    try {
        decoded = jwt.decode(token, process.env.ACCESS_SECRET_KEY); // TODO CHANGE TO VERIFY
    } catch (e) {
        return ws.close(1003, 'unauthorized error');
    }

    if (!decoded.id) {
        return ws.close(1003, 'unauthorized error');
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
    if (!msg.data) {
        ws.send(JSON.stringify({ error: 'Data is empty' }));
        return;
    }
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
        case 'SEARCH':
            await search(msg.data);
            break;
        default: ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
}

async function search(data) {
    const users = await User.findAll({
        where: {
            [Op.or]: {
                name: {
                    [Op.iLike]: `%${data.search}%`
                },
                surname: {
                    [Op.iLike]: `%${data.search}%`
                },
            }
        }
    });

    const userSocket = userSockets.get(data.userId);
    if (userSocket && userSocket.readyState === WebSocket.OPEN) {
        userSocket.send(JSON.stringify({data: users, type: 'SEARCH'}));
    }
}

async function createChat(data) {
    const id = uuid.v4();
    await Chat.create({id, users: JSON.stringify(data.users)});
}

async function loadMessages(data) {
    const id = data.chatId;
    console.log(data)
    const messages = await Message.findAll({where: {chatId: id}});
    const userSocket = userSockets.get(data.userId);
    if (userSocket && userSocket.readyState === WebSocket.OPEN) {
        userSocket.send(JSON.stringify({data: messages, type: 'LOAD_MESSAGES'}));
    }
}

async function sendMessage(data) {
    if (!data.chatId) {
        const chatId = uuid.v4();
        const messageId = uuid.v4();
        const senderId = data.senderId;
        const recipientId = data.recipientId;
        const time = Date.now()

        const newChat = await Chat.create({
            id: chatId,
            users: JSON.stringify([senderId, recipientId])
        });

        const id1 = uuid.v4();
        const id2 = uuid.v4();
        await ChatUser.create({chatId, userId: senderId, id: id1});
        await ChatUser.create({chatId, userId: recipientId, id: id2});

        const message = await Message.create({
            id: messageId,
            text: data.text,
            senderId,
            chatId
        });

        const senderSocket = userSockets.get(senderId);
        const recipientSocket = userSockets.get(recipientId);

        if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
            senderSocket.send(JSON.stringify({data: message, type: 'CREATE_CHAT'}));
        } else {
            console.log(senderSocket, senderSocket.readyState === WebSocket.OPEN)
        }

        if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
            recipientSocket.send(JSON.stringify({data: message,  type: 'SEND_MESSAGE'}));
        }

        return;
    }

    const chat = await Chat.findByPk(data.chatId);
    if (!chat) {
        console.log('Error');
    }

    const users = await ChatUser.findAll({where: {chatId: data.chatId}})

    const id = uuid.v4();
    const message = await Message.create({
        id,
        text: data.text,
        senderId: data.senderId,
        chatId: data.chatId
    });

    for (const user of users) {
        const userSocket = userSockets.get(user.dataValues.userId);
        console.log('\n\n')
        console.log(user.dataValues.id);
        if (userSocket && userSocket.readyState === WebSocket.OPEN) {
            userSocket.send(JSON.stringify({data: message, type: 'SEND_MESSAGE'}));
        }
    }
}

async function start() {
    try {
        console.log(process.env.BD_NAME)
        await db.authenticate();
        await db.sync();
    } catch (e) {
        console.log(e);
    }
}

start().then();