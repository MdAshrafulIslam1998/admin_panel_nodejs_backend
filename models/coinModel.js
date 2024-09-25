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

module.exports = {
  getCoinsByUserId,
};
