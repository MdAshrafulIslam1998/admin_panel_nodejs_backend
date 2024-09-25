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

module.exports = {
  getCoinsByUserId,
  updateCoinValue // Add this line
};