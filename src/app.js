// 引入必要的模組
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Web3 = require('web3');
const cron = require('node-cron');
const { jwtAuthMiddleware } = require('./utils/jwtUtils');
const playerRoutes = require('./routes/api'); // 假設所有玩家相關路由都在這個文件中

// 初始化環境變量
dotenv.config();

// 初始化 Express 應用
const app = express();

// 設置 bodyParser，以便解析 HTTP 請求正文
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 連接 MongoDB 數據庫
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', (error) => console.error(error));
mongoose.connection.once('open', () => console.log('Connected to database'));

// 設置 Web3 提供程序
const providerUrl = process.env.PROVIDER_URL || '您的預設提供商URL';
const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));

// 設置靜態文件目錄
app.use(express.static('public'));

// 使用路由
app.use('/api', playerRoutes);

// 定義根路由
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// 使用 JWT 中間件保護路由
app.use(jwtAuthMiddleware);

// 定義計劃任務
cron.schedule('*/10 * * * * *', async () => {
    // 定期執行的任務
    console.log('定時任務正在執行');
});

// 啟動 Express 服務器
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

module.exports = app;
