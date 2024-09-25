const db = require('../config/db.config'); // Adjust the path as necessary

class TransactionHistoryModel {
    static async getAllTransactions() {
        const query = 'SELECT * FROM transaction_history';
        const [rows] = await db.execute(query);
        return rows;
    }

    // Fetch transactions by user ID
    static async getTransactionsByUserId(userId) {
        const query = 'SELECT name, email, coin, date, created_by FROM transaction_history WHERE uid = ?';
        const [rows] = await db.execute(query, [userId]);
        return rows;
    }

    static async getAllUserWiseTransactions() {
        const query = `
            SELECT 
                MIN(name) AS name,
                MIN(email) AS email,
                uid,
                SUM(COALESCE(coin, 0)) AS total_coins
            FROM transaction_history
            GROUP BY uid
        `;
        const [rows] = await db.execute(query);
        return rows;
    }
}


module.exports = TransactionHistoryModel;
