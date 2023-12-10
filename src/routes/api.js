const express = require('express');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Player = require('../models/player');
const PlayerNFT = require('../models/playerNFT');
const Web3 = require('web3');
const nftContractAddress = '您的智能合约地址'; // 替換為您的智能合约地址
const nftContract = require('../path/to/your/nftContract'); // 替換為智能合约的實際路徑

const router = express.Router();

// 定義註冊路由
router.post(
    '/register',
    [
      // 使用 express-validator 中間件對輸入進行驗證
      check('email').isEmail().withMessage('無效的電子郵件'), // 驗證電子郵件格式
      check('password').isLength({ min: 6 }).withMessage('密碼至少需6個字符長'), // 驗證密碼長度
      check('nickname').notEmpty().withMessage('昵稱為必填') // 驗證昵稱是否提供
    ],
    async (req, res) => {
      // 驗證請求數據
      const errors = validationResult(req);
      // 如果驗證失敗，返回錯誤信息
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      // 從請求體中提取 email, password 和 nickname
      const { email, password, nickname } = req.body;
      try {
        // 檢查資料庫中是否已有相同電子郵件的用戶
        const userExists = await Player.findOne({ email });
        if (userExists) {
          // 如果用戶已存在，返回錯誤響應
          return res.status(400).json({ success: false, message: '該電子郵件已被註冊' });
        }

        // 對密碼進行哈希處理
        const hashedPassword = await bcrypt.hash(password, 10);
        // 創建新用戶
        const player = await Player.create({
          email,
          password: hashedPassword,
          nickname
        });
        // 返回成功響應
        res.json({ success: true, message: '玩家註冊成功' });
      } catch (error) {
        // 捕獲並處理任何異常，返回錯誤響應
        res.status(400).json({ success: false, message: error.message });
      }
    }
  );

// 定義登錄路由
router.post(
    '/login',
    [
      // 對請求進行驗證
      check('email').isEmail().withMessage('無效的電子郵件'), // 驗證電子郵件格式
      check('password').notEmpty().withMessage('密碼為必填') // 確保密碼欄位被填寫
    ],
    async (req, res) => {
      // 檢查驗證結果
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // 如果有驗證錯誤，返回錯誤信息
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      // 從請求體中提取 email 和 password
      const { email, password } = req.body;
      try {
        // 檢查用戶是否存在
        const player = await Player.findOne({ email });
        if (!player) {
          // 如果找不到用戶，返回錯誤信息
          return res.status(400).json({ success: false, message: '無效的電子郵件或密碼' });
        }

        // 驗證密碼是否正確
        const isMatch = await bcrypt.compare(password, player.password);
        if (!isMatch) {
          // 如果密碼不匹配，返回錯誤信息
          return res.status(400).json({ success: false, message: '無效的電子郵件或密碼' });
        }

        // 生成 JWT 令牌
        const token = jwt.sign({ playerId: player._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // 返回成功信息及令牌
        res.json({ success: true, message: '玩家成功登入', token });
      } catch (error) {
        // 發生錯誤，返回錯誤信息
        res.status(400).json({ success: false, message: error.message });
      }
    }
  );


// 卡片出售功能的實現
    router.post('/sell', async (req, res) => {
        const { sellerId, cardId, price } = req.body;

        try {
            // 查詢賣家和卡牌信息
            const seller = await Player.findById(sellerId);
            const card = await Card.findById(cardId);

            if (!seller) {
                return res.status(404).json({
                    success: false,
                    message: '賣家不存在！'
                });
            }

            if (!card) {
                return res.status(404).json({
                    success: false,
                    message: '卡牌不存在！'
                });
            }

            // 判斷賣家是否擁有該卡牌
            const playerNFT = await PlayerNFT.findOne({
                PlayerID: sellerId,
                TokenID: card.tokenId
            });

            if (!playerNFT) {
                return res.status(400).json({
                    success: false,
                    message: '賣家未擁有該卡牌！'
                });
            }

            // 更新玩家NFT表，將卡牌轉移給智能合約地址
            playerNFT.NFTContractAddress = nftContractAddress;
            await playerNFT.save();

            // 觸發智能合約的卡牌出售函數
            await contract.sellCard(card.tokenId, price);

            return res.json({
                success: true,
                message: '卡牌出售成功！'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '處理卡牌出售時發生錯誤',
                error: error.message
            });
        }
    });


// 抽卡功能的 API 端口
    router.post('/draw_card', async (req, res) => {
        const { playerId } = req.body;

        try {
            // 查詢玩家信息
            const player = await Player.findById(playerId);

            if (!player) {
                return res.status(404).json({
                    success: false,
                    message: '玩家不存在！'
                });
            }

            // 從智能合約抽取卡牌
            const accounts = await web3.eth.getAccounts();
            const drawCardMethod = nftContract.methods.drawCard();
            const gas = await drawCardMethod.estimateGas({ from: accounts[0] });
            const drawnCardTokenId = await drawCardMethod.call({ from: accounts[0], gas: gas });

            // 將抽取的卡牌添加到玩家的 NFT 表中
            const newPlayerNFT = new PlayerNFT({
                PlayerNFTID: Date.now(), // 可以使用其他生成唯一ID的方法
                PlayerID: playerId,
                NFTContractAddress: nftContractAddress,
                TokenID: drawnCardTokenId,
            });

            await newPlayerNFT.save();

            // 返回成功消息和卡牌信息
            res.json({
                success: true,
                message: '卡牌抽取成功！',
                card: {
                    tokenId: drawnCardTokenId
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '無法抽取卡牌',
                error: error.message
            });
        }
    });


module.exports = router;


