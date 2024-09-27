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



module.exports = {
  getCoinsByUserId,
  updateCoinValue,
  getTransactionHistory,  // Add this line
  getTransactionCount,
  getTransactionHistoryByCategory,  // Add this line
  getTransactionCountByCategory // Add this line

};