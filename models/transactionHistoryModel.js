const db = require('../config/db.config'); // Adjust the path as necessary

class TransactionHistoryModel {
    static async getAllTransactions() {
        const query = 'SELECT * FROM transaction_history';
        const [rows] = await db.execute(query);
        return rows;
    }

    static async getPaginatedTransactions(limit, offset) {
        const query = `
            SELECT * FROM transaction_history
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.execute(query, [limit, offset]);
        return rows;
    }

    // Fetch transactions by user ID
    static async getTransactionsByUserId(userId) {
        const query = 'SELECT name, email, coin, date, created_by FROM transaction_history WHERE uid = ?';
        const [rows] = await db.execute(query, [userId]);
        return rows;
    }

    static async getTotalTransactions() {
        const query = 'SELECT COUNT(*) as total FROM transaction_history';
        const [rows] = await db.execute(query);
        return rows[0].total;
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

    // Fetch categorized transactions by category and coin type for a specific user
        static async getTransactionsCategorizedByCategory(userId) {
            const query = `
                SELECT cat_id, coin_type, SUM(coin) as total_coins
                FROM transaction_history
                WHERE uid = ?
                GROUP BY cat_id, coin_type
            `;
            const [rows] = await db.execute(query, [userId]);
            return rows;
        }



     // Check if there are any transactions associated with the category ID
     static async checkTransactionHistoryByCategoryId(catId) {
        const query = 'SELECT COUNT(*) as count FROM transaction_history WHERE cat_id = ?';
        const [rows] = await db.execute(query, [catId]);
        return rows[0].count > 0; // Returns true if there are associated transactions
    }
}


module.exports = TransactionHistoryModel;
