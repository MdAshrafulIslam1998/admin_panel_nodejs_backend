// models/userModel.js
const db = require('../config/db.config');

const getUserById = async (userId) => {
  const query = `
      SELECT name AS username, email, phone, dob, gender, address, level, status 
      FROM user 
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
      user u
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
    FROM user 
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
  const query = 'UPDATE user SET status = ? WHERE user_id = ?';
  const [result] = await db.execute(query, [status, userId]);
  return result;
};


// models/userModel.js
const getUsersByLevelId = async (levid) => {
  const query = 'SELECT user_id FROM user WHERE level = ?';
  const [result] = await db.execute(query, [levid]);
  return result; // Returns an array of users associated with the level
};


// Update all users who are associated with a specific levid
const updateUsersLevelByLevid = async (levid) => {
  const query = 'UPDATE user SET level = ? WHERE level = ?';
  const [result] = await db.execute(query, [levid, levid]);  // Update all users with the new levid
  return result.affectedRows; // Return the number of rows updated
};



// models/userModel.js
const getTotalUserCount = async () => {
  const query = `SELECT COUNT(*) AS total FROM user`;
  const [result] = await db.execute(query);
  return result[0].total;
};

const getUserByEmail = async (email) => {
  const query =
    `SELECT user_id, name, email, phone, dob, gender, address, level, status, password 
       FROM user 
       WHERE email = ?`;
  const [result] = await db.execute(query, [email]);
  return result.length > 0 ? result[0] : null;
};



// Function to check if a user already exists by email
const checkUserByEmail = async (email) => {
  const query = `SELECT * FROM user WHERE email = ?`;
  const [result] = await db.execute(query, [email]);
  return result.length > 0 ? result[0] : null;
};

// Function to create a new user
const createUser = async (userData) => {
  const query = `
      INSERT INTO user (
          name, email, password, phone, documents, user_id, dob, gender, address, level, status, approved_by, push_token, date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const { name, email, password, phone, documents, user_id, dob, gender, address, level } = userData;

  await db.execute(query, [
    name,
    email,
    password,
    phone || null,             // Optional fields set to null if not provided
    documents || null,         // Optional fields set to null if not provided
    user_id,                   // UUID for user_id
    dob || null,               // Optional fields set to null if not provided
    gender,                    // Required
    address || null,           // Optional fields set to null if not provided
    level || null,             // Optional fields set to null if not provided
    'INITIATED',               // Default status
    null,                      // approved_by - set to null as not provided
    null,                      // push_token - set to null as not provided
    new Date()                 // Set current timestamp
  ]);

  return { name, email }; // Return only the necessary information
};


// Function to fetch user profile by user ID
const fetchUserProfileById = async (userId) => {
  // Query to get user details
  const userQuery = `
      SELECT name AS username, email, phone, dob, gender, address, level, profile_pic
      FROM user
      WHERE user_id = ?
  `;
  const [userResult] = await db.execute(userQuery, [userId]);
  const userProfile = userResult.length > 0 ? userResult[0] : null;

  if (!userProfile) {
    return null; // User not found
  }

  // Query to get the level name based on level ID
  const levelQuery = `
      SELECT level_name
      FROM levels
      WHERE levid = ?
  `;
  const [levelResult] = await db.execute(levelQuery, [userProfile.level]);
  userProfile.level_name = levelResult.length > 0 ? levelResult[0].level_name : null;

  // Query to calculate total primary coins
  const primaryCoinsQuery = `
      SELECT SUM(coin) AS total_primary_coins
      FROM transaction_history
      WHERE uid = ? AND coin_type = 'PRIMARY'
  `;
  const [primaryCoinsResult] = await db.execute(primaryCoinsQuery, [userId]);
  userProfile.total_primary_coins = primaryCoinsResult[0].total_primary_coins || 0;

  // Query to calculate total secondary coins
  const secondaryCoinsQuery = `
      SELECT SUM(coin) AS total_secondary_coins
      FROM transaction_history
      WHERE uid = ? AND coin_type = 'SECONDARY'
  `;
  const [secondaryCoinsResult] = await db.execute(secondaryCoinsQuery, [userId]);
  userProfile.total_secondary_coins = secondaryCoinsResult[0].total_secondary_coins || 0;

  return userProfile;
};

const getVerifiedUsersWithCoins = async (offset, limit) => {
  const query = `
      SELECT 
          u.user_id,
          u.name,
          u.email,
          u.level AS level_id,
          l.level_name,
          u.status,
          u.date,
          COALESCE(SUM(CASE WHEN th.coin_type = 'PRIMARY' THEN th.coin ELSE 0 END), 0) AS \`primary\`,
          COALESCE(SUM(CASE WHEN th.coin_type = 'SECONDARY' THEN th.coin ELSE 0 END), 0) AS secondary
      FROM user u
      LEFT JOIN levels l ON u.level = l.levid
      LEFT JOIN transaction_history th ON u.user_id = th.uid
      WHERE u.status = 'VERIFIED'
      GROUP BY u.user_id
      LIMIT ? OFFSET ?;
  `;

  const [users] = await db.execute(query, [limit, offset]);
  return users;
};


// Count total verified users for pagination
const getTotalVerifiedUserCount = async () => {
  const query = `SELECT COUNT(*) AS total FROM user WHERE status = 'VERIFIED'`;
  const [result] = await db.execute(query);
  return result[0].total;
};


// New function to get paginated pending users
const getPendingUsers = async (offset, limit) => {
  const query = `
      SELECT 
          u.user_id,
          u.name,
          u.email,
          u.status,
          u.date
      FROM user u
      WHERE u.status = 'PENDING'
      GROUP BY u.user_id
      LIMIT ? OFFSET ?;
  `;

  const [users] = await db.execute(query, [limit, offset]);
  return users;
};

// Count total pending users for pagination
const getTotalPendingUserCount = async () => {
  const query = `SELECT COUNT(*) AS total FROM user WHERE status = 'PENDING'`;
  const [result] = await db.execute(query);
  return result[0].total;
};




const getBlockedUsers = async (offset, limit) => {
  const query = `
      SELECT 
          u.user_id,
          u.name,
          u.email,
          u.status,
          u.date
      FROM user u
      WHERE u.status = 'BLOCKED'
      GROUP BY u.user_id
      LIMIT ? OFFSET ?;
  `;

  const [users] = await db.execute(query, [limit, offset]);
  return users;
};

// Count total pending users for pagination
const getTotalBlockedUserCount = async () => {
  const query = `SELECT COUNT(*) AS total FROM user WHERE status = 'BLOCKED'`;
  const [result] = await db.execute(query);
  return result[0].total;
};


// Function to update user password

module.exports = {
  getUserProfileById,
  getTotalUserCount,
  updateUsersLevelByLevid,
  getUserById,
  updateUserLevel,
  getUsersByLevelId,
  updateUserStatus,
  getUserList,
  getTotalBlockedUserCount,
  getBlockedUsers,
  getUserByEmail,
  checkUserByEmail,
  getTotalVerifiedUserCount,
  getVerifiedUsersWithCoins,
  fetchUserProfileById,
  getTotalPendingUserCount,
  getPendingUsers,
  createUser
};