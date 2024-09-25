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
  const query = `
    SELECT 
      u.user_id, 
      u.name, 
      u.email, 
      u.level AS level_id,  -- Keep the level ID for reference
      l.level_name,         -- Join to get level_name
      u.status, 
      u.date 
    FROM 
      User u
    LEFT JOIN 
      levels l ON u.level = l.levid  -- Join levels table based on level
    LIMIT ? OFFSET ?`;
  
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


const updateUserLevel = async (userId, newLevel) => {
  // Validate that the newLevel exists in the levels table
  const [levelCheck] = await db.execute('SELECT levid FROM levels WHERE levid = ?', [newLevel]);
  if (levelCheck.length === 0) {
      throw new Error('Invalid level ID'); // or return null
  }

  const query = `
      UPDATE user 
      SET level = ? 
      WHERE user_id = ?
  `;
  const [result] = await db.execute(query, [newLevel, userId]);
  return result.affectedRows > 0; // Returns true if the update was successful
};


const updateUserStatus = async (userId, status) => {
  const query = 'UPDATE User SET status = ? WHERE user_id = ?';
  const [result] = await db.execute(query, [status, userId]);
  return result;
};


// models/userModel.js
const getUsersByLevelId = async (levid) => {
  const query = 'SELECT user_id FROM user WHERE level = ?';
  const [result] = await db.execute(query, [levid]);
  return result; // Returns an array of users associated with the level
};






module.exports = {
  getUserProfileById,
  getUserById,
  updateUserLevel,
  getUsersByLevelId,
  updateUserStatus,
  getUserList
};