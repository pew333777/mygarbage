require('dotenv').config();

// 現在您可以像這樣使用環境變量
const dbUser = process.env.DB_USER;
const apiKey = process.env.API_KEY;
const app = require('./src/app');

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});