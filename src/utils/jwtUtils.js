// utils/jwtUtils.js
const jwt = require('jsonwebtoken');

// 生成JWT令牌的函數
// data: 要加入令牌的資料
const generateToken = (data) => jwt.sign(data, process.env.JWT_SECRET, { expiresIn: '1h' });

// 驗證JWT令牌的函數
// token: 從客戶端接收的JWT令牌
const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

// JWT驗證中間件，用於保護路由
// 驗證HTTP請求中的JWT令牌，確保它有效
const jwtAuthMiddleware = (req, res, next) => {
  try {
    // 從HTTP請求頭中提取令牌
    const token = req.headers.authorization.split(' ')[1];
    // 使用verifyToken函數驗證令牌
    const decoded = verifyToken(token);
    // 將解碼後的資料添加到請求對象
    req.user = decoded;
    next(); // 繼續執行下一個中間件或路由處理器
  } catch (error) {
    // 如有錯誤，返回401狀態碼和錯誤信息
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { generateToken, verifyToken, jwtAuthMiddleware };

