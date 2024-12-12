// models/coinModel.js
const db = require('../config/db.config');

const getCoinsByUserId = async (userId) => {
  const query = `
    SELECT 
      SUM(CASE WHEN coin_type = 'PRIMARY' THEN coin_value ELSE 0 END) AS primary_coin,
      SUM(CASE WHEN coin_type = 'SECONDARY' THEN coin_value ELSE 0 END) AS secondary_coin
    FROM Coin WHERE uid = ?;
  `;
  const [result] = await db.execute(query, [userId]);
  return result.length > 0 ? result[0] : { primary_coin: 0, secondary_coin: 0 };
};


const updateCoinValue = async (userId, coinType, newCoinValue) => {
  const query = `
    UPDATE Coin 
    SET coin_value = ? 
    WHERE uid = ? AND coin_type = ?
  `;
  const [result] = await db.execute(query, [newCoinValue, userId, coinType]);
  return result.affectedRows > 0; // Returns true if at least one row was updated
};


// Function to fetch paginated transaction history
const getTransactionHistory = async (limit, offset) => {
  const query = `
    SELECT id, cat_id, uid, coin, date, name, email, created_by, coin_type 
    FROM transaction_history 
    ORDER BY date DESC 
    LIMIT ? OFFSET ?;
  `;
  const [results] = await db.execute(query, [limit, offset]);
  return results;
};

// Function to fetch total transaction count
const getTransactionCount = async () => {
  const query = `SELECT COUNT(*) as total FROM transaction_history;`;
  const [result] = await db.execute(query);
  return result[0].total;  // Return the total count
};


// Function to fetch paginated transaction history by category
const getTransactionHistoryByCategory = async (cat_id, limit, offset) => {
  const query = `
    SELECT id, cat_id, uid, coin, date, name, email, created_by, coin_type 
    FROM transaction_history 
    WHERE cat_id = ? 
    ORDER BY date DESC 
    LIMIT ? OFFSET ?;
  `;
  const [results] = await db.execute(query, [cat_id, limit, offset]);
  return results;
};

// Function to fetch total transaction count by category
const getTransactionCountByCategory = async (cat_id) => {
  const query = `SELECT COUNT(*) as total FROM transaction_history WHERE cat_id = ?;`;
  const [result] = await db.execute(query, [cat_id]);
  return result[0].total;  // Return the total count for the specific category
};


// Function to add entries to the transaction history
const addTransactionHistory = async (catId, uid, primaryCoin, secondaryCoin, createdBy) => {
  // Fetch user details using uid
  const userQuery = `
      SELECT name, email FROM user WHERE user_id = ?
  `;
  const [userResult] = await db.execute(userQuery, [uid]);

  if (userResult.length === 0) {
      throw new Error('User not found');
  }

  const { name, email } = userResult[0];

  const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Insert PRIMARY coin transaction
  const primaryQuery = `
      INSERT INTO transaction_history (cat_id, uid, coin, name, email, created_by, coin_type, date)
      VALUES (?, ?, ?, ?, ?, ?, 'PRIMARY', ?)
  `;
  await db.execute(primaryQuery, [catId, uid, primaryCoin, name, email, createdBy, currentDate]);

  // Insert SECONDARY coin transaction
  const secondaryQuery = `
      INSERT INTO transaction_history (cat_id, uid, coin, name, email, created_by, coin_type, date)
      VALUES (?, ?, ?, ?, ?, ?, 'SECONDARY', ?)
  `;
  await db.execute(secondaryQuery, [catId, uid, secondaryCoin, name, email, createdBy, currentDate]);

  return {
      catId,
      uid,
      primaryCoin,
      secondaryCoin,
      name,
      email,
      createdBy,
      date: currentDate
  };
};



module.exports = {
  getCoinsByUserId,
  updateCoinValue,
  addTransactionHistory,
  getTransactionHistory,  // Add this line
  getTransactionCount,
  getTransactionHistoryByCategory,  // Add this line
  getTransactionCountByCategory // Add this line

};