const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    PlayerID: {
        type: Number,
        required: true
    },
    Email: {
        type: String,
        required: true,
        unique: true,  // 确保电子邮件地址是唯一的
        match: [/.+\@.+\..+/, 'Please fill a valid email address']  // 简单的电子邮件格式验证
    },
    Password: {
        type: String,
        required: true
    },
    Nickname: {
        type: String,
        required: true
    },
    // 您可以在此处添加更多字段
});

module.exports = mongoose.model('Player', playerSchema);