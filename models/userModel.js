// models/userModel.js
const db = require('../config/db.config');

const getUserById = async (userId) => {
  const query = `
      SELECT name AS username, email, phone, dob, gender, address, level, status 
      FROM User 
      WHERE user_id = ?
  `;
  const [result] = await db.execute(query, [userId]);
  return result.length > 0 ? result[0] : null;
};



const getUserList = async (offset, limit) => {
  const query = 'SELECT user_id, name, email, level, status, date FROM User LIMIT ? OFFSET ?';
  const [result] = await db.execute(query, [limit, offset]);
  return result;
};

const getUserProfileById = async (userId) => {
  const query = `
    SELECT 
      name AS username, 
      email, 
      phone, 
      dob, 
      gender, 
      address, 
      level, 
      status 
    FROM User 
    WHERE user_id = ?`;
  
  const [result] = await db.execute(query, [userId]);
  return result.length > 0 ? result[0] : null;
};



module.exports = {
  getUserProfileById,
  getUserById,
  getUserList
};