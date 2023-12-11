// 引入必要的模块
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Web3 = require('web3');
const cron = require('node-cron');
const { jwtAuthMiddleware } = require('./utils/jwtUtils');
const playerRoutes = require('./routes/api');
const PlayerNFT = require('./models/playerNFT'); // 确保引入 PlayerNFT 模型

// 初始化环境变量
dotenv.config();

// 初始化 Express 应用
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 连接 MongoDB 数据库
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', (error) => console.error(error));
mongoose.connection.once('open', () => console.log('Connected to database'));

// 设置 Web3 提供程序
const providerUrl = process.env.PROVIDER_URL || 'mongodb://localhost:27017/account';
const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
const nftContract = new web3.eth.Contract(/* 合约ABI */, /* 合约地址 */);

// 监听 Transfer 事件
nftContract.events.Transfer({
    fromBlock: 'latest'
})
.on('data', async (event) => {
    console.log('Transfer event:', event);
    const { from, to, tokenId } = event.returnValues;

    // 检查 'to' 地址是否是我们的用户
    const player = await Player.findOne({ walletAddress: to });
    if (player) {
        // 玩家获得了 NFT，更新数据库
        const newPlayerNFT = new PlayerNFT({
            PlayerID: player._id,
            NFTContractAddress: nftContract.options.address,
            TokenID: tokenId
        });
        await newPlayerNFT.save();
    }

    // 处理发送者 (from 地址) 失去了 NFT
    if (from !== '0x0000000000000000000000000000000000000000') { // 检查是否不是创造性的转移
        const sender = await Player.findOne({ walletAddress: from });
        if (sender) {
            await PlayerNFT.findOneAndRemove({
                PlayerID: sender._id,
                NFTContractAddress: nftContract.options.address,
                TokenID: tokenId
            });
        }
    }
})
.on('error', console.error);

// 使用 cron 每 10 秒更新一次数据库
cron.schedule('*/10 * * * * *', async () => {
    console.log('Updating database...');
    // 实现定期更新数据库的逻辑...
});

// 定义更新玩家 NFT 表的 API 接口
app.post('/api/update_player_nft', async (req, res) => {
    // API 逻辑...
});

// 设置静态文件目录
app.use(express.static('public'));

// 使用路由
app.use('/api', playerRoutes);

// 定义根路由
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// 使用 JWT 中间件保护路由
app.use(jwtAuthMiddleware);

// 启动 Express 服务器
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

module.exports = app;
