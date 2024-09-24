// models/userModel.js
const db = require('../config/db.config');

const getUserById = async (userId) => {
  const query = 'SELECT name, email, level, date, status FROM User WHERE user_id = ?';
  const [result] = await db.execute(query, [userId]);
  return result.length > 0 ? result[0] : null;
};

module.exports = {
  getUserById
};
