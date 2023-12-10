const bcrypt = require('bcryptjs');

const hashPassword = async (password) => bcrypt.hash(password, 10);
const comparePassword = async (password, hashedPassword) => bcrypt.compare(password, hashedPassword);

module.exports = { hashPassword, comparePassword };