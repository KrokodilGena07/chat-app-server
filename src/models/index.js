const db = require('../config/db');
const {DataTypes} = require('sequelize');

const User = db.define('user', {
    id: {primaryKey: true, type: DataTypes.UUID},
    name: {type: DataTypes.STRING, allowNull: false},
    surname: {type: DataTypes.STRING},
    email: {type: DataTypes.STRING, allowNull: false, unique: true},
    password: {type: DataTypes.STRING, allowNull: false},
    image: {type: DataTypes.STRING},
    activationLink: {type: DataTypes.UUID, unique: true},
    isActivated: {type: DataTypes.BOOLEAN, defaultValue: false}
});

const Session = db.define('sessions', {
    id: {primaryKey: true, type: DataTypes.UUID},
    refreshToken: {type: DataTypes.STRING, allowNull: false, unique: true}
});

const Chat = db.define('chat', {
    id: {primaryKey: true, type: DataTypes.UUID},
    users: {type: DataTypes.STRING, defaultValue: '[]'}
});

const Message = db.define('message', {
    id: {primaryKey: true, type: DataTypes.UUID},
    senderId: {type: DataTypes.UUID, allowNull: false},
    date: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
    text: {type: DataTypes.STRING, allowNull: false},
    type: {type: DataTypes.ENUM('USER', 'SYSTEM'), defaultValue: 'USER'}
});

User.hasMany(Session);
Session.belongsTo(User);

Chat.hasMany(Message);
Message.belongsTo(Chat);

module.exports = {
    User,
    Session,
    Chat,
    Message
};