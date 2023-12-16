// 引入必要的模組
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Web3 = require('web3');
const cron = require('node-cron');
const { jwtAuthMiddleware } = require('./utils/jwtUtils');
const playerRoutes = require('./routes/api');
const PlayerNFT = require('./models/playerNFT'); // 確保引入 PlayerNFT 模型
const nftContractABI = require('./config/nftContractABI');
const nftContractAddress = process.env.NFT_CONTRACT_ADDRESS;


// 初始化環境參數
dotenv.config();

// 初始化 Express 應用
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 連接 MongoDB 資料库
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', (error) => console.error(error));
mongoose.connection.once('open', () => console.log('Connected to database'));

// 設置 Web3 提供程式
const providerUrl = process.env.PROVIDER_URL || 'https://goerli.infura.io/v3/dd5f558c605f4322a16f6496c0bc7f3c';
const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
const nftContract = new web3.eth.Contract(nftContractABI,nftContractAddress);

// 監聽 Transfer 事件
nftContract.events.Transfer({
    fromBlock: 'latest'
})
.on('data', async (event) => {
    console.log('Transfer event:', event);
    const { from, to, tokenId } = event.returnValues;

    // 檢查 'to' 地址是否是我們的玩家
    const player = await Player.findOne({ walletAddress: to });
    if (player) {
        // 玩家獲得了 NFT，更新資料庫
        const newPlayerNFT = new PlayerNFT({
            PlayerID: player._id,
            NFTContractAddress: nftContract.options.address,
            TokenID: tokenId
        });
        await newPlayerNFT.save();
    }

    // 處理發送者 (from 地址) 失去了 NFT
    if (from !== '0x0000000000000000000000000000000000000000') { //檢查是否不是創造性的轉移
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

// 使用 cron 每 10 秒更新一次資料库
cron.schedule('*/10 * * * * *', async () => {
    console.log('Updating database...');

    try {
        // 擷取所有玩家
        const players = await getAllPlayers();

        // 所有玩家的 NFT
        const allNFTs = await getAllNFTsFromBlockchain();

        // 更新每个玩家的 NFT 資料
        for (const nft of allNFTs) {
            const { owner, tokenId } = nft;

            // 檢查資料庫中是否已有此 NFT
            const existingNFT = await PlayerNFT.findOne({ TokenID: tokenId });

            if (!existingNFT) {
                // 如果資料庫中没有這個 NFT，則添加它
                const newPlayerNFT = new PlayerNFT({
                    PlayerID: owner,
                    NFTContractAddress: nftContract.options.address,
                    TokenID: tokenId
                });
                await newPlayerNFT.save();
            } else {
                // 如果資料庫中有這個 NFT，可以更新相關資料
                existingNFT.PlayerID = owner;
                await existingNFT.save();
            }
        }
    } catch (error) {
        console.error('Error updating database:', error);
    }

    console.log('Database updated');
});

// 定義更新玩家 NFT 表的 API 介面
app.post('/api/update_player_nft', async (req, res) => {
    try {
        // 從請求體中獲取數據
        const { playerID, nftContractAddress, tokenID } = req.body;

        // 查找或創建新的 PlayerNFT 記錄
        let playerNFT = await PlayerNFT.findOne({ PlayerID: playerID, TokenID: tokenID });
        if (!playerNFT) {
            playerNFT = new PlayerNFT({ PlayerID: playerID, NFTContractAddress: nftContractAddress, TokenID: tokenID });
        } else {
            // 更新現有記錄的資訊（如果需要）
            playerNFT.NFTContractAddress = nftContractAddress;
        }

        // 保存記錄到資料庫
        await playerNFT.save();

        // 返回成功回應
        res.status(200).json({ message: 'Player NFT updated successfully', playerNFT });
    } catch (error) {
        //   錯誤處理
        console.error('Error updating player NFT:', error);
        res.status(500).json({ message: 'Error updating player NFT', error: error.message });
    }
});

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

//  啟動 Express 伺服器
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

module.exports = app;
